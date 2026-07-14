"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { extractGameId, buildEmbedUrl, isValidMakeCodeUrl } from "@/lib/game-utils"
import type { Game, GameWithDetails } from "@/lib/definitions"

export async function createGame(_prevState: { error: string }, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Debes iniciar sesión para publicar juegos" }
  }

  const url = formData.get("url") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const categoryId = formData.get("category_id") as string

  if (!url || !title) {
    return { error: "URL y título son obligatorios" }
  }

  if (!isValidMakeCodeUrl(url)) {
    return { error: "La URL no es válida. Debe ser de arcade.makecode.com" }
  }

  const gameId = extractGameId(url)
  if (!gameId) {
    return { error: "No se pudo extraer el ID del juego de la URL" }
  }

  const { data: existing } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .maybeSingle()

  if (existing) {
    return { error: "Este juego ya fue publicado" }
  }

  const embedUrl = buildEmbedUrl(gameId)

  const { error } = await supabase.from("games").insert({
    id: gameId,
    user_id: user.id,
    title,
    description: description || null,
    embed_url: embedUrl,
    category_id: categoryId || null,
    status: "approved",
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function toggleVisibility(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { data: game } = await supabase
    .from("games")
    .select("hidden")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .single()

  if (!game) return { error: "Juego no encontrado" }

  const { error } = await supabase
    .from("games")
    .update({ hidden: !game.hidden })
    .eq("id", gameId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteGame(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", gameId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function getGames(options: {
  search?: string
  categoryId?: string
  page?: number
  limit?: number
} = {}) {
  const supabase = await createClient()
  const { search, categoryId, page = 0, limit = 12 } = options

  let query = supabase
    .from("games")
    .select("*, categories(*), profiles(username, avatar_url)", { count: "exact" })
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  return { games: data as unknown as GameWithDetails[], total: count ?? 0 }
}

export async function getGameById(id: string) {
  const supabase = await createClient()

  const { data: game, error } = await supabase
    .from("games")
    .select("*, categories(*), profiles(username, avatar_url)")
    .eq("id", id)
    .single()

  if (error || !game) return null

  const { data: tags } = await supabase
    .from("game_tags")
    .select("tags(*)")
    .eq("game_id", id)

  const { data: avgRating } = await supabase
    .from("ratings")
    .select("value")
    .eq("game_id", id)

  const avg = avgRating && avgRating.length > 0
    ? Math.round((avgRating.reduce((sum, r) => sum + r.value, 0) / avgRating.length) * 10) / 10
    : null

  const { data: { user } } = await supabase.auth.getUser()
  let userRating: number | null = null

  if (user) {
    const { data: myRating } = await supabase
      .from("ratings")
      .select("value")
      .eq("game_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    userRating = myRating?.value ?? null
  }

  return {
    ...game,
    tags: tags?.map((t: { tags: unknown }) => t.tags) ?? [],
    avg_rating: avg,
    user_rating: userRating,
  } as unknown as GameWithDetails
}

export async function getUserGames(username: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (!profile) return []

  const { data: games } = await supabase
    .from("games")
    .select("*, categories(*), profiles(username, avatar_url)")
    .eq("user_id", profile.id)
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })

  return (games ?? []) as unknown as GameWithDetails[]
}

export async function getMyGames() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: games } = await supabase
    .from("games")
    .select("*, categories(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (games ?? []) as unknown as GameWithDetails[]
}

/** Minimal game data used in GameThumbnail / CuratedSection */
export type GameThumbnailData = Pick<GameWithDetails, "id" | "title" | "thumbnail_url" | "avg_rating">

/** Get the most recently added games (for "Últimos Juegos") */
export async function getRecentGames(limit = 8): Promise<GameThumbnailData[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("games")
    .select("id, title, thumbnail_url")
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data ?? []).map((g) => ({ ...g, avg_rating: null }))
}

/** Get the most played games by view count (for "Más Jugados") */
export async function getMostPlayed(limit = 8): Promise<GameThumbnailData[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("games")
    .select("id, title, thumbnail_url")
    .eq("status", "approved")
    .eq("hidden", false)
    .order("views", { ascending: false })
    .limit(limit)

  return (data ?? []).map((g) => ({ ...g, avg_rating: null }))
}

/** Get the highest-rated games (for "Mejor Valorados") */
export async function getTopRated(limit = 8): Promise<GameThumbnailData[]> {
  const supabase = await createClient()

  // Fetch a larger pool to compute ratings from
  const { data: games } = await supabase
    .from("games")
    .select("id, title, thumbnail_url")
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!games || games.length === 0) return []

  const gameIds = games.map((g) => g.id)

  const { data: ratings } = await supabase
    .from("ratings")
    .select("game_id, value")
    .in("game_id", gameIds)

  // group ratings by game
  const ratingMap = new Map<string, number[]>()
  for (const r of ratings ?? []) {
    const bucket = ratingMap.get(r.game_id)
    if (bucket) bucket.push(r.value)
    else ratingMap.set(r.game_id, [r.value])
  }

  const gamesWithRating = games.map((g) => {
    const vals = ratingMap.get(g.id)
    return {
      ...g,
      avg_rating: vals
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
        : null,
    }
  })

  // Sort by avg_rating descending, then by title for deterministic order
  return gamesWithRating
    .filter((g) => g.avg_rating !== null)
    .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
    .slice(0, limit)
}
