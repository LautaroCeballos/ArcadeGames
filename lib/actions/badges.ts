"use server"

import { createClient } from "@/lib/supabase/server"
import type { Badge } from "@/lib/definitions"

export async function checkAndAwardBadges(userId: string) {
  const supabase = await createClient()
  const results: string[] = []

  const gameIdsResult = await supabase
    .from("games")
    .select("id, views")
    .eq("user_id", userId)
    .eq("status", "approved")

  const totalGames = gameIdsResult.data?.length ?? 0
  const totalViews = (gameIdsResult.data ?? []).reduce((s, g) => s + (g.views ?? 0), 0)

  let totalStars = 0
  const ownGameIds = (gameIdsResult.data ?? []).map((g) => g.id)
  if (ownGameIds.length > 0) {
    const { data: ratingsData } = await supabase
      .from("ratings")
      .select("value")
      .in("game_id", ownGameIds)
    totalStars = (ratingsData ?? []).reduce((s, r) => s + r.value, 0)
  }

  const { count: ratedByUser } = await supabase
    .from("ratings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  const badgesAwarded: string[] = []

  if (totalGames >= 1) badgesAwarded.push("Primer Juego")
  if (totalGames >= 5) badgesAwarded.push("Cinco Juegos")
  if (totalGames >= 10) badgesAwarded.push("Diez Juegos")
  if (totalStars >= 1) badgesAwarded.push("Primera Estrella")
  if (totalStars >= 50) badgesAwarded.push("50 Estrellas")
  if (totalStars >= 100) badgesAwarded.push("100 Estrellas")
  if (totalViews >= 1000) badgesAwarded.push("1000 Vistas")
  if (ratedByUser && ratedByUser >= 10) badgesAwarded.push("Explorador")

  for (const badgeName of badgesAwarded) {
    await supabase.rpc("award_badge", { user_id: userId, badge_name: badgeName })
    results.push(badgeName)
  }

  return results
}

export async function getAllBadges() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("badges")
    .select("*")
    .order("name")

  return (data ?? []) as Badge[]
}
