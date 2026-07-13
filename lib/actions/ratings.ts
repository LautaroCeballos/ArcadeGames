"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

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

  revalidatePath(`/juego/${gameId}`)
  return { success: true }
}
