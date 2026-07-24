"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { ProfileWithStats } from "@/lib/definitions"

export async function getProfileByUsername(username: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, email, avatar_url, bio, website, birth_month, birth_year, country, role, created_at")
    .eq("username", username)
    .maybeSingle()

  if (!profile) return null

  const [gameIdsResult, followersResult, followingResult, badgesResult] = await Promise.all([
    supabase
      .from("games")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "approved")
      .eq("hidden", false),
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", profile.id),
  ])

  const gameIds = (gameIdsResult.data ?? []).map((g) => g.id)

  let totalStars = 0
  let avgRating: number | null = null

  if (gameIds.length > 0) {
    const { data: ratingsData } = await supabase
      .from("ratings")
      .select("value")
      .in("game_id", gameIds)

    const allRatings = ratingsData ?? []
    totalStars = allRatings.reduce((sum, r) => sum + r.value, 0)
    if (allRatings.length > 0) {
      avgRating = Math.round((totalStars / allRatings.length) * 10) / 10
    }
  }

  return {
    ...profile,
    total_games: gameIdsResult.data?.length ?? 0,
    total_stars: totalStars,
    avg_rating: avgRating,
    followers_count: followersResult.count ?? 0,
    following_count: followingResult.count ?? 0,
    badges: (badgesResult.data ?? []) as unknown as ProfileWithStats["badges"],
  } satisfies ProfileWithStats
}

export async function checkUsername(username: string, currentUserId: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle()

  if (!existing) return { available: true }
  if (existing.id === currentUserId) return { available: true }
  return { available: false }
}

export async function updateAccount(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  const username = formData.get("username") as string
  const bio = formData.get("bio") as string
  const avatarFile = formData.get("avatar") as File | null
  const birthMonthRaw = formData.get("birth_month") as string
  const birthYearRaw = formData.get("birth_year") as string
  const country = formData.get("country") as string

  const updates: Record<string, string | number | null> = {}

  if (username) {
    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/
    if (!USERNAME_REGEX.test(username)) {
      return { error: "El nombre de usuario debe tener entre 3 y 30 caracteres y solo puede contener letras, números y guión bajo" }
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle()

    if (existing && existing.id !== user.id) {
      return { error: "Ese nombre de usuario ya está en uso" }
    }

    updates.username = username
  }

  updates.bio = bio || null
  updates.country = country || null

  // ── Avatar upload ─────────────────────────────────────────
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 2 * 1024 * 1024) {
      return { error: "La imagen no puede superar los 2 MB" }
    }

    const ext = avatarFile.name.split(".").pop() ?? "png"
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true })

    if (uploadError) return { error: "Error al subir la imagen: " + uploadError.message }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
    updates.avatar_url = urlData.publicUrl
  }

  // ── Birth fields ──────────────────────────────────────────
  if (birthMonthRaw) {
    const bm = parseInt(birthMonthRaw, 10)
    if (isNaN(bm) || bm < 1 || bm > 12) {
      return { error: "El mes de nacimiento no es válido" }
    }
    updates.birth_month = bm
  } else {
    updates.birth_month = null
  }

  if (birthYearRaw) {
    const by = parseInt(birthYearRaw, 10)
    const currentYear = new Date().getFullYear()
    if (isNaN(by) || by < 1900 || by > currentYear) {
      return { error: `El año de nacimiento debe estar entre 1900 y ${currentYear}` }
    }
    updates.birth_year = by
  } else {
    updates.birth_year = null
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/perfil", "layout")
  revalidatePath("/cuenta", "layout")
  return { success: true }
}

export async function updatePassword(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  const password = formData.get("password") as string
  const passwordConfirm = formData.get("password_confirm") as string

  if (!password) return { error: "La contraseña es obligatoria" }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" }
  }
  if (!/[A-Z]/.test(password)) {
    return { error: "La contraseña debe contener al menos una mayúscula" }
  }
  if (!/[a-z]/.test(password)) {
    return { error: "La contraseña debe contener al menos una minúscula" }
  }
  if (!/[0-9]/.test(password)) {
    return { error: "La contraseña debe contener al menos un número" }
  }

  if (password !== passwordConfirm) {
    return { error: "Las contraseñas no coinciden" }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  return { success: true }
}

export async function updateMyProfile(_prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  const bio = formData.get("bio") as string
  const website = formData.get("website") as string
  const avatarUrl = formData.get("avatar_url") as string

  const { error } = await supabase
    .from("profiles")
    .update({
      bio: bio || null,
      website: website || null,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/perfil", "layout")
  return { success: true }
}
