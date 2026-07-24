"use server"

import { createClient } from "@/lib/supabase/server"
import type { PlayerRankingEntry, Game, Profile } from "@/lib/definitions"

/**
 * Retrieves the top players ordered by total stars received across all their games.
 * Aggregates ratings in JS for flexibility without requiring DB functions.
 */
export async function getPlayerLeaderboard(limit = 50): Promise<PlayerRankingEntry[]> {
  const supabase = await createClient()

  // 1. Get all approved, non-hidden games with owner profile
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("id, user_id, profiles!inner(username, avatar_url)")
    .eq("status", "approved")
    .eq("hidden", false)

  if (gamesError || !games || games.length === 0) {
    return []
  }

  const gameIds = games.map((g: { id: string }) => g.id)

  // 2. Get all ratings for those games
  const { data: ratings } = await supabase
    .from("ratings")
    .select("game_id, value")
    .in("game_id", gameIds)

  // 3. Aggregate by game owner
  type GameRow = { id: string; user_id: string; profiles: Pick<Profile, "username" | "avatar_url"> }
  const gameRows = games as unknown as GameRow[]

  const userMap = new Map<
    string,
    {
      username: string
      avatarUrl: string | null
      totalStars: number
      gamesCount: number
      rankedGames: Set<string>
    }
  >()

  for (const game of gameRows) {
    const existing = userMap.get(game.user_id)
    if (existing) {
      existing.gamesCount++
    } else {
      userMap.set(game.user_id, {
        username: game.profiles.username ?? "Anónimo",
        avatarUrl: game.profiles.avatar_url,
        totalStars: 0,
        gamesCount: 1,
        rankedGames: new Set(),
      })
    }
  }

  type RatingRow = { game_id: string; value: number }
  const ratingRows = (ratings ?? []) as RatingRow[]

  // Build a lookup: game_id → user_id
  const gameOwnerMap = new Map<string, string>()
  for (const game of gameRows) {
    gameOwnerMap.set(game.id, game.user_id)
  }

  for (const rating of ratingRows) {
    const ownerId = gameOwnerMap.get(rating.game_id)
    if (ownerId) {
      const user = userMap.get(ownerId)
      if (user) {
        user.totalStars += rating.value
        user.rankedGames.add(rating.game_id)
      }
    }
  }

  // 4. Sort and limit
  const leaderboard = Array.from(userMap.entries())
    .filter(([_, u]) => u.totalStars > 0)
    .sort((a, b) => b[1].totalStars - a[1].totalStars)
    .slice(0, limit)
    .map(([_, u]) => ({
      username: u.username,
      avatarUrl: u.avatarUrl,
      totalStars: u.totalStars,
      gamesCount: u.gamesCount,
      rankedGames: u.rankedGames.size,
    }))

  return leaderboard
}
