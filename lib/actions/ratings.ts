"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { checkAndAwardBadges } from "@/lib/actions/badges"
import { createNotification } from "@/lib/notifications"

export async function rateGame(gameId: string, value: number) {
  if (value < 1 || value > 5) {
    return { error: "El rating debe ser entre 1 y 5" }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Debes iniciar sesión para votar" }
  }

  const { error } = await supabase.from("ratings").upsert(
    {
      game_id: gameId,
      user_id: user.id,
      value,
    },
    { onConflict: "game_id, user_id" }
  )

  if (error) {
    return { error: error.message }
  }

  const { data: game } = await supabase
    .from("games")
    .select("id, title, user_id")
    .eq("id", gameId)
    .single()

  if (game) {
    await Promise.all([
      checkAndAwardBadges(game.user_id),
      checkAndAwardBadges(user.id),
    ])

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
        message: `${raterProfile?.username ?? "Alguien"} le dio ${value} estrellas a tu juego "${game.title}"`,
        link_url: `/juego/${gameId}`,
        actor_id: user.id,
      })
    }
  }

  revalidatePath(`/juego/${gameId}`)
  return { success: true }
}
