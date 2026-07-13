"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { extractGameId, buildEmbedUrl, isValidMakeCodeUrl } from "@/lib/game-utils"
import type { Game, GameWithDetails } from "@/lib/definitions"

export async function createGame(_prevState: { error: string }, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Debes iniciar sesión para publicar juegos" }
  }

  const url = formData.get("url") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const categoryId = formData.get("category_id") as string

  if (!url || !title) {
    return { error: "URL y título son obligatorios" }
  }

  if (!isValidMakeCodeUrl(url)) {
    return { error: "La URL no es válida. Debe ser de arcade.makecode.com" }
  }

  const gameId = extractGameId(url)
  if (!gameId) {
    return { error: "No se pudo extraer el ID del juego de la URL" }
  }

  const { data: existing } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .maybeSingle()

  if (existing) {
    return { error: "Este juego ya fue publicado" }
  }

  const embedUrl = buildEmbedUrl(gameId)

  const { error } = await supabase.from("games").insert({
    id: gameId,
    user_id: user.id,
    title,
    description: description || null,
    embed_url: embedUrl,
    category_id: categoryId || null,
    status: "approved",
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function toggleVisibility(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { data: game } = await supabase
    .from("games")
    .select("hidden")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .single()

  if (!game) return { error: "Juego no encontrado" }

  const { error } = await supabase
    .from("games")
    .update({ hidden: !game.hidden })
    .eq("id", gameId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteGame(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", gameId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function getGames(options: {
  search?: string
  categoryId?: string
  page?: number
  limit?: number
} = {}) {
  const supabase = await createClient()
  const { search, categoryId, page = 0, limit = 12 } = options

  let query = supabase
    .from("games")
    .select("*, categories(*), profiles(username, avatar_url)", { count: "exact" })
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  return { games: data as unknown as GameWithDetails[], total: count ?? 0 }
}

export async function getGameById(id: string) {
  const supabase = await createClient()

  const { data: game, error } = await supabase
    .from("games")
    .select("*, categories(*), profiles(username, avatar_url)")
    .eq("id", id)
    .single()

  if (error || !game) return null

  const { data: tags } = await supabase
    .from("game_tags")
    .select("tags(*)")
    .eq("game_id", id)

  const { data: avgRating } = await supabase
    .from("ratings")
    .select("value")
    .eq("game_id", id)

  const avg = avgRating && avgRating.length > 0
    ? Math.round((avgRating.reduce((sum, r) => sum + r.value, 0) / avgRating.length) * 10) / 10
    : null

  const { data: { user } } = await supabase.auth.getUser()
  let userRating: number | null = null

  if (user) {
    const { data: myRating } = await supabase
      .from("ratings")
      .select("value")
      .eq("game_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    userRating = myRating?.value ?? null
  }

  return {
    ...game,
    tags: tags?.map((t: { tags: unknown }) => t.tags) ?? [],
    avg_rating: avg,
    user_rating: userRating,
  } as unknown as GameWithDetails
}

export async function getUserGames(username: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (!profile) return []

  const { data: games } = await supabase
    .from("games")
    .select("*, categories(*), profiles(username, avatar_url)")
    .eq("user_id", profile.id)
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })

  return (games ?? []) as unknown as GameWithDetails[]
}

export async function getMyGames() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: games } = await supabase
    .from("games")
    .select("*, categories(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (games ?? []) as unknown as GameWithDetails[]
}
