"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Increments the view count for a game. Called from TrackView client component.
 * Uses a simple read+write to avoid requiring a DB function.
 */
export async function incrementGameView(gameId: string): Promise<void> {
  const supabase = await createClient()

  // Read current views
  const { data, error: readError } = await supabase
    .from("games")
    .select("views")
    .eq("id", gameId)
    .single()

  if (readError || !data) {
    console.error("incrementGameView: failed to read views", readError)
    return
  }

  // Increment and write back
  const { error: writeError } = await supabase
    .from("games")
    .update({ views: (data.views ?? 0) + 1 })
    .eq("id", gameId)

  if (writeError) {
    console.error("incrementGameView: failed to update views", writeError)
  }
}
