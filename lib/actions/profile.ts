"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { ProfileWithStats } from "@/lib/definitions"

export async function getProfileByUsername(username: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, website, created_at")
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
      .select("id", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
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
