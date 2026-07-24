"use server"

import { createClient } from "@/lib/supabase/server"
import type { GameWithDetails, Profile, Tag } from "@/lib/definitions"

export async function searchAll(query: string) {
  const supabase = await createClient()
  const search = `%${query}%`

  const [gamesResult, usersResult, tagsResult] = await Promise.all([
    supabase
      .from("games")
      .select("*, profiles(username, avatar_url)")
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

  return {
    games: gamesResult.data ?? [],
    users: usersResult.data ?? [],
    tags: tagsResult.data ?? [],
  }
}
