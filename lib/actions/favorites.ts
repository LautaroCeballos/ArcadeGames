"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications"
import type { GameWithDetails, Tag, Profile } from "@/lib/definitions"

/**
 * Toggle a favorite for the current user on a game.
 * - If the favorite exists → DELETE (unfavorite)
 * - If it doesn't → INSERT (favorite) + notify game owner
 */
export async function toggleFavorite(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  // Check if the game belongs to the user (cannot favorite your own game)
  const { data: game } = await supabase
    .from("games")
    .select("user_id, title")
    .eq("id", gameId)
    .single()

  if (game && game.user_id === user.id) {
    return { error: "No puedes marcar tu propio juego como favorito" }
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("game_id")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .maybeSingle()

  if (existing) {
    // Unfavorite
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("game_id", gameId)

    if (error) return { error: error.message }

    revalidatePath(`/juego/${gameId}`)
    revalidatePath("/perfil", "layout")
    return { favorited: false }
  }

  // Favorite
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, game_id: gameId })

  if (error) return { error: error.message }

  // Notify the game owner (already fetched above)
  if (game && game.user_id !== user.id) {
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()

    await createNotification({
      user_id: game.user_id,
      type: "new_favorite",
      title: "Nuevo favorito",
      message: `@${actorProfile?.username ?? "Alguien"} marcó tu juego "${game.title}" como favorito`,
      link_url: `/juego/${gameId}`,
      actor_id: user.id,
    })
  }

  revalidatePath(`/juego/${gameId}`)
  revalidatePath("/perfil", "layout")
  return { favorited: true }
}

/**
 * Check if the current user has favorited a specific game.
 */
export async function isFavorited(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from("favorites")
    .select("game_id")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .maybeSingle()

  return data !== null
}

/**
 * Get all games favorited by a user (by username).
 * Returns games with tags and star counts (public data only: approved + visible).
 */
export async function getUserFavorites(username: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (!profile) return []

  const { data: favorites } = await supabase
    .from("favorites")
    .select("game_id, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  if (!favorites || favorites.length === 0) return []

  const gameIds = favorites.map((f) => f.game_id)

  // Only get approved + visible games
  const { data: games } = await supabase
    .from("games")
    .select("*, profiles!games_user_id_fkey(username, avatar_url)")
    .in("id", gameIds)
    .eq("status", "approved")
    .eq("hidden", false)

  if (!games || games.length === 0) return []

  const gameList = games as unknown as (import("@/lib/definitions").Game & { profiles: Pick<Profile, "username" | "avatar_url"> | null })[]

  // Fetch tags for each game
  const { data: gameTags } = await supabase
    .from("game_tags")
    .select("game_id, tags(*)")
    .in("game_id", gameList.map((g) => g.id))

  const tagsMap = new Map<string, Tag[]>()
  for (const gt of gameTags ?? []) {
    const existing = tagsMap.get(gt.game_id) || []
    existing.push((gt as { tags: unknown }).tags as Tag)
    tagsMap.set(gt.game_id, existing)
  }

  // Fetch star counts
  const { data: ratings } = await supabase
    .from("ratings")
    .select("game_id, value")
    .in("game_id", gameList.map((g) => g.id))

  const ratingMap = new Map<string, number>()
  for (const r of ratings ?? []) {
    ratingMap.set(r.game_id, (ratingMap.get(r.game_id) ?? 0) + 1)
  }

  return gameList.map((g) => ({
    ...g,
    tags: tagsMap.get(g.id) ?? [],
    stars_count: ratingMap.get(g.id) ?? null,
    has_starred: null,
    is_favorited: null,
  })) as unknown as GameWithDetails[]
}
