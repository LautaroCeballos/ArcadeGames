"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { checkAndAwardBadges } from "@/lib/actions/badges"
import { createNotification } from "@/lib/notifications"

/**
 * Toggle a star on a game.
 * - If the user already starred the game, remove the star (unlike).
 * - If the user has not starred the game, add a star (like).
 */
export async function toggleStar(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Debes iniciar sesión para votar" }
  }

  // Check if user already gave a star
  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    // Un-star: remove the rating
    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("id", existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Star: insert with value = 1
    const { error } = await supabase.from("ratings").insert({
      game_id: gameId,
      user_id: user.id,
      value: 1,
    })

    if (error) {
      return { error: error.message }
    }

    // Only notify when a star is ADDED, not removed
    const { data: game } = await supabase
      .from("games")
      .select("id, title, user_id")
      .eq("id", gameId)
      .single()

    if (game) {
      await checkAndAwardBadges(game.user_id)

      // Notify game owner if the rater is not the owner
      if (game.user_id !== user.id) {
        const { data: raterProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single()

        await createNotification({
          user_id: game.user_id,
          type: "new_rating",
          title: "Nueva estrella",
          message: `${raterProfile?.username ?? "Alguien"} le dio una estrella a tu juego "${game.title}"`,
          link_url: `/juego/${gameId}`,
          actor_id: user.id,
        })
      }
    }
  }

  await checkAndAwardBadges(user.id)

  revalidatePath(`/juego/${gameId}`)
  return { success: true }
}
