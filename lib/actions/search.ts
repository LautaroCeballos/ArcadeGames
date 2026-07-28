"use server"

import { createClient } from "@/lib/supabase/server"
import type { GameWithDetails, Profile, Tag } from "@/lib/definitions"

/**
 * Fetch tags for a list of game IDs. Used to attach category info to search results.
 */
export async function getTagsForGames(gameIds: string[]) {
  if (gameIds.length === 0) return {} as Record<string, Tag[]>
  const supabase = await createClient()

  const { data: gameTags } = await supabase
    .from("game_tags")
    .select("game_id, tags(*)")
    .in("game_id", gameIds)

  const tagsMap: Record<string, Tag[]> = {}
  for (const gt of gameTags ?? []) {
    const row = gt as { game_id: string; tags: unknown }
    if (!tagsMap[row.game_id]) tagsMap[row.game_id] = []
    tagsMap[row.game_id].push(row.tags as Tag)
  }

  return tagsMap
}

export async function searchAll(query: string) {
  const supabase = await createClient()
  const search = `%${query}%`

  const [gamesResult, usersResult, tagsResult] = await Promise.all([
    supabase
      .from("games")
      .select("*, profiles!games_user_id_fkey(username, avatar_url)")
      .eq("status", "approved")
      .eq("hidden", false)
      .ilike("title", search)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("id, username, avatar_url, bio")
      .ilike("username", search)
      .order("username", { ascending: true })
      .limit(8),
    supabase
      .from("tags")
      .select("*")
      .ilike("name", search)
      .order("name", { ascending: true })
      .limit(8),
  ])

  const games = (gamesResult.data ?? []) as GameWithDetails[]
  const gameIds = games.map((g) => g.id)

  // Attach tags
  const tagsMap = gameIds.length > 0 ? await getTagsForGames(gameIds) : {}

  return {
    games: games.map((g) => ({
      ...g,
      tags: tagsMap[g.id] ?? [],
    })) as unknown as GameWithDetails[],
    users: usersResult.data ?? [],
    tags: tagsResult.data ?? [],
  }
}
