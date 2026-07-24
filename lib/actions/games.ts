"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications"
import { extractGameId, buildEmbedUrl, isValidMakeCodeUrl, extractScratchId, buildScratchEmbedUrl, isValidScratchUrl, extractGamePlatform } from "@/lib/game-utils"
import { checkAndAwardBadges } from "@/lib/actions/badges"
import type { Game, GameWithDetails, Profile, Tag } from "@/lib/definitions"

function getPlatformTagName(platform: string): string {
  return platform === 'scratch' ? 'Scratch' : 'MakeCode Arcade'
}

export async function createGame(_prevState: { error: string }, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Debes iniciar sesión para publicar juegos" }
  }

  const url = formData.get("url") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const thumbnailUrl = formData.get("thumbnail_url") as string
  const platform = (formData.get("platform") as string) || extractGamePlatform(url) || 'makecode'
  const tagIdsRaw = formData.get("tag_ids") as string
  const tagIds: string[] = tagIdsRaw ? JSON.parse(tagIdsRaw) : []

  const action = formData.get("action") as string
  const isDraft = action === "draft"

  if (!url || !title) {
    return { error: "URL y título son obligatorios" }
  }

  if (platform !== 'makecode' && platform !== 'scratch') {
    return { error: "Plataforma no válida" }
  }

  let gameId: string | null
  let embedUrl: string

  if (platform === 'makecode') {
    if (!isValidMakeCodeUrl(url)) {
      return { error: "La URL no es válida. Debe ser de arcade.makecode.com" }
    }

    gameId = extractGameId(url)
    if (!gameId) {
      return { error: "No se pudo extraer el ID del juego de la URL" }
    }

    embedUrl = buildEmbedUrl(gameId)
  } else {
    if (!isValidScratchUrl(url)) {
      return { error: "La URL no es válida. Debe ser de scratch.mit.edu/projects/{id}" }
    }

    gameId = extractScratchId(url)
    if (!gameId) {
      return { error: "No se pudo extraer el ID del proyecto de Scratch" }
    }

    embedUrl = buildScratchEmbedUrl(gameId)
  }

  const { data: existing } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .maybeSingle()

  if (existing) {
    return { error: "Este juego ya fue publicado" }
  }

  const { error } = await supabase.from("games").insert({
    id: gameId,
    user_id: user.id,
    title,
    description: description || null,
    embed_url: embedUrl,
    thumbnail_url: thumbnailUrl || null,
    status: isDraft ? "draft" : "pending",
    platform,
  })

  if (error) {
    return { error: error.message }
  }

  // Insert tags: platform tag + user-selected tags
  const platformTagName = getPlatformTagName(platform)
  const { data: platformTag } = await supabase
    .from("tags")
    .select("id")
    .eq("name", platformTagName)
    .single()

  const allTagIds: string[] = []
  if (platformTag) allTagIds.push(platformTag.id)

  // Only add user-selected tags that are not the platform tag
  for (const tagId of tagIds) {
    if (tagId !== platformTag?.id && !allTagIds.includes(tagId)) {
      allTagIds.push(tagId)
    }
  }

  if (allTagIds.length > 0) {
    const { error: tagError } = await supabase.from("game_tags").insert(
      allTagIds.map((tag_id) => ({ game_id: gameId, tag_id }))
    )
    if (tagError) {
      return { error: tagError.message }
    }
  }

  if (!isDraft) {
    await checkAndAwardBadges(user.id)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single()

  revalidatePath("/", "layout")
  redirect(`/perfil/${profile?.username ?? user.id}`)
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

  revalidatePath("/perfil/[username]", "page")
  return { success: true }
}

export async function updateGame(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  const gameId = formData.get("id") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const thumbnailUrl = formData.get("thumbnail_url") as string
  const tagIdsRaw = formData.get("tag_ids") as string
  const tagIds: string[] = tagIdsRaw ? JSON.parse(tagIdsRaw) : []

  if (!gameId || !title) {
    return { error: "ID y título son obligatorios" }
  }

  // Verify ownership
  const { data: game } = await supabase
    .from("games")
    .select("id, platform, status")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .single()

  if (!game) return { error: "Juego no encontrado o no autorizado" }

  // Reset to pending for re-moderation (but keep drafts as drafts)
  const newStatus = game.status === "draft" ? "draft" : "pending"
  const { error } = await supabase
    .from("games")
    .update({
      title,
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      status: newStatus,
      rejection_reason: null,
    })
    .eq("id", gameId)

  if (error) return { error: error.message }

  // Replace game_tags: ensure platform tag + selected tags
  const platformTagName = getPlatformTagName(game.platform)
  const { data: platformTag } = await supabase
    .from("tags")
    .select("id")
    .eq("name", platformTagName)
    .single()

  const allTagIds: string[] = []
  if (platformTag) allTagIds.push(platformTag.id)

  for (const tagId of tagIds) {
    if (tagId !== platformTag?.id && !allTagIds.includes(tagId)) {
      allTagIds.push(tagId)
    }
  }

  // Delete existing game_tags, then insert new ones
  const { error: deleteError } = await supabase
    .from("game_tags")
    .delete()
    .eq("game_id", gameId)

  if (deleteError) return { error: deleteError.message }

  if (allTagIds.length > 0) {
    const { error: insertError } = await supabase.from("game_tags").insert(
      allTagIds.map((tag_id) => ({ game_id: gameId, tag_id }))
    )
    if (insertError) return { error: insertError.message }
  }

  revalidatePath("/perfil/[username]", "page")
  revalidatePath(`/juego/${gameId}`)
  revalidatePath("/moderar", "page")
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

  revalidatePath("/perfil/[username]", "page")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function getGames(options: {
  search?: string
  tagIds?: string[]
  page?: number
  limit?: number
} = {}) {
  const supabase = await createClient()
  const { search, tagIds, page = 0, limit = 12 } = options

  let query = supabase
    .from("games")
    .select("*, profiles(username, avatar_url)", { count: "exact" })
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  if (tagIds && tagIds.length > 0) {
    // Get game IDs that have ALL specified tags
    const { data: tagFilterData } = await supabase
      .from("game_tags")
      .select("game_id, tag_id")
      .in("tag_id", tagIds)

    if (tagFilterData && tagFilterData.length > 0) {
      const gameCounts = new Map<string, number>()
      for (const gt of tagFilterData) {
        gameCounts.set(gt.game_id, (gameCounts.get(gt.game_id) || 0) + 1)
      }
      const matchingIds = Array.from(gameCounts.entries())
        .filter(([, count]) => count === tagIds.length)
        .map(([id]) => id)

      if (matchingIds.length === 0) {
        return { games: [], total: 0 }
      }
      query = query.in("id", matchingIds)
    } else {
      return { games: [], total: 0 }
    }
  }

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  // Fetch tags for each game
  const games = data as unknown as (Game & { profiles: Pick<Profile, "username" | "avatar_url"> | null })[]
  const gameIds = games.map((g) => g.id)

  let tagsMap = new Map<string, Tag[]>()
  if (gameIds.length > 0) {
    const { data: gameTags } = await supabase
      .from("game_tags")
      .select("game_id, tags(*)")
      .in("game_id", gameIds)

    for (const gt of gameTags ?? []) {
      const existing = tagsMap.get(gt.game_id) || []
      existing.push((gt as { tags: unknown }).tags as Tag)
      tagsMap.set(gt.game_id, existing)
    }
  }

  const gamesWithTags = games.map((g) => ({
    ...g,
    tags: tagsMap.get(g.id) ?? [],
    avg_rating: null,
    user_rating: null,
  }))

  return { games: gamesWithTags as unknown as GameWithDetails[], total: count ?? 0 }
}

export async function getGameById(id: string) {
  const supabase = await createClient()

  const { data: game, error } = await supabase
    .from("games")
    .select("*, profiles(username, avatar_url)")
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
    .select("*, profiles(username, avatar_url)")
    .eq("user_id", profile.id)
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })

  // Fetch tags for each game
  const gameList = (games ?? []) as unknown as (Game & { profiles: Pick<Profile, "username" | "avatar_url"> | null })[]
  const gameIds = gameList.map((g) => g.id)

  let tagsMap = new Map<string, Tag[]>()
  if (gameIds.length > 0) {
    const { data: gameTags } = await supabase
      .from("game_tags")
      .select("game_id, tags(*)")
      .in("game_id", gameIds)

    for (const gt of gameTags ?? []) {
      const existing = tagsMap.get(gt.game_id) || []
      existing.push((gt as { tags: unknown }).tags as Tag)
      tagsMap.set(gt.game_id, existing)
    }
  }

  return gameList.map((g) => ({
    ...g,
    tags: tagsMap.get(g.id) ?? [],
    avg_rating: null,
    user_rating: null,
  })) as unknown as GameWithDetails[]
}

export async function getMyGames() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch tags for each game
  const gameList = (games ?? []) as Game[]
  const gameIds = gameList.map((g) => g.id)

  let tagsMap = new Map<string, Tag[]>()
  if (gameIds.length > 0) {
    const { data: gameTags } = await supabase
      .from("game_tags")
      .select("game_id, tags(*)")
      .in("game_id", gameIds)

    for (const gt of gameTags ?? []) {
      const existing = tagsMap.get(gt.game_id) || []
      existing.push((gt as { tags: unknown }).tags as Tag)
      tagsMap.set(gt.game_id, existing)
    }
  }

  return gameList.map((g) => ({
    ...g,
    profiles: null,
    tags: tagsMap.get(g.id) ?? [],
    avg_rating: null,
    user_rating: null,
  })) as unknown as GameWithDetails[]
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

// ─── Moderator / Admin helpers ────────────────────────────────────────────────

async function getUserRole(): Promise<'user' | 'moderator' | 'admin' | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return profile?.role ?? 'user'
}

async function assertModerator(): Promise<void> {
  const role = await getUserRole()
  if (role !== 'moderator' && role !== 'admin') {
    throw new Error("No autorizado. Se requiere rol de moderador o admin.")
  }
}

async function assertAdmin(): Promise<void> {
  const role = await getUserRole()
  if (role !== 'admin') {
    throw new Error("No autorizado. Se requiere rol de admin.")
  }
}

// ─── Moderation actions ───────────────────────────────────────────────────────

export async function getPendingGames(page = 0, limit = 20) {
  await assertModerator()
  const supabase = await createClient()

  const { data: games, count } = await supabase
    .from("games")
    .select("*, profiles(username, avatar_url)", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  // Fetch tags for each game
  const gameList = (games ?? []) as unknown as (Game & { profiles: Pick<Profile, "username" | "avatar_url"> | null })[]
  const gameIds = gameList.map((g) => g.id)

  let tagsMap = new Map<string, Tag[]>()
  if (gameIds.length > 0) {
    const { data: gameTags } = await supabase
      .from("game_tags")
      .select("game_id, tags(*)")
      .in("game_id", gameIds)

    for (const gt of gameTags ?? []) {
      const existing = tagsMap.get(gt.game_id) || []
      existing.push((gt as { tags: unknown }).tags as Tag)
      tagsMap.set(gt.game_id, existing)
    }
  }

  const gamesWithTags = gameList.map((g) => ({
    ...g,
    tags: tagsMap.get(g.id) ?? [],
    avg_rating: null,
    user_rating: null,
  }))

  return { games: gamesWithTags as unknown as GameWithDetails[], total: count ?? 0 }
}

export async function getModeratedGames(options: {
  status?: string
  page?: number
  limit?: number
} = {}) {
  await assertModerator()
  const supabase = await createClient()
  const { status, page = 0, limit = 20 } = options

  let query = supabase
    .from("games")
    .select("*, profiles(username, avatar_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (status) {
    query = query.eq("status", status)
  } else {
    query = query.neq("status", "draft")
  }

  const { data: games, count } = await query

  const gameList = (games ?? []) as unknown as (Game & { profiles: Pick<Profile, "username" | "avatar_url"> | null })[]
  const gameIds = gameList.map((g) => g.id)

  let tagsMap = new Map<string, Tag[]>()
  if (gameIds.length > 0) {
    const { data: gameTags } = await supabase
      .from("game_tags")
      .select("game_id, tags(*)")
      .in("game_id", gameIds)

    for (const gt of gameTags ?? []) {
      const existing = tagsMap.get(gt.game_id) || []
      existing.push((gt as { tags: unknown }).tags as Tag)
      tagsMap.set(gt.game_id, existing)
    }
  }

  const gamesWithTags = gameList.map((g) => ({
    ...g,
    tags: tagsMap.get(g.id) ?? [],
    avg_rating: null,
    user_rating: null,
  }))

  return { games: gamesWithTags as unknown as GameWithDetails[], total: count ?? 0 }
}

export async function approveGame(gameId: string) {
  await assertModerator()
  const supabase = await createClient()

  const { error } = await supabase
    .from("games")
    .update({ status: "approved" })
    .eq("id", gameId)

  if (error) return { error: error.message }

  // Fetch game details for notifications
  const { data: game } = await supabase
    .from("games")
    .select("id, title, user_id")
    .eq("id", gameId)
    .single()

  if (game) {
    // 1. Notify the game owner
    await createNotification({
      user_id: game.user_id,
      type: "game_approved",
      title: "Juego aprobado",
      message: `¡Tu juego "${game.title}" fue aprobado y ya está visible!`,
      link_url: `/juego/${gameId}`,
    })

    // 2. Fan-out to followers of the creator
    const { data: followers } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", game.user_id)

    if (followers && followers.length > 0) {
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", game.user_id)
        .single()

      const creatorName = creatorProfile?.username ?? "Alguien"
      for (const f of followers) {
        await createNotification({
          user_id: f.follower_id,
          type: "new_game_from_following",
          title: "Nuevo juego publicado",
          message: `${creatorName} publicó un nuevo juego: "${game.title}"`,
          link_url: `/juego/${gameId}`,
          actor_id: game.user_id,
        })
      }
    }
  }

  revalidatePath("/moderar")
  revalidatePath("/perfil/[username]", "page")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function rejectGame(gameId: string, reason?: string) {
  await assertModerator()
  const supabase = await createClient()

  const { error } = await supabase
    .from("games")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", gameId)

  if (error) return { error: error.message }

  // Fetch game details for notification
  const { data: game } = await supabase
    .from("games")
    .select("id, title, user_id")
    .eq("id", gameId)
    .single()

  if (game) {
    await createNotification({
      user_id: game.user_id,
      type: "game_rejected",
      title: "Juego rechazado",
      message: reason
        ? `Tu juego "${game.title}" fue rechazado. Motivo: ${reason}`
        : `Tu juego "${game.title}" fue rechazado.`,
      link_url: `/perfil/yo`,
    })
  }

  revalidatePath("/moderar")
  revalidatePath("/perfil/[username]", "page")
  return { success: true }
}

export async function revertToPending(gameId: string) {
  await assertModerator()
  const supabase = await createClient()

  const { error } = await supabase
    .from("games")
    .update({ status: "pending", rejection_reason: null })
    .eq("id", gameId)

  if (error) return { error: error.message }

  revalidatePath("/moderar")
  revalidatePath("/perfil/[username]", "page")
  return { success: true }
}

export async function modToggleVisibility(gameId: string) {
  await assertModerator()
  const supabase = await createClient()

  const { data: game } = await supabase
    .from("games")
    .select("hidden")
    .eq("id", gameId)
    .single()

  if (!game) return { error: "Juego no encontrado" }

  const { error } = await supabase
    .from("games")
    .update({ hidden: !game.hidden })
    .eq("id", gameId)

  if (error) return { error: error.message }

  revalidatePath("/moderar")
  revalidatePath("/perfil/[username]", "page")
  return { success: true }
}

export async function modDeleteGame(gameId: string) {
  await assertModerator()
  const supabase = await createClient()

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", gameId)

  if (error) return { error: error.message }

  revalidatePath("/moderar")
  revalidatePath("/perfil/[username]", "page")
  revalidatePath("/", "layout")
  return { success: true }
}

// ─── Publish draft ────────────────────────────────────────────────────────────

export async function publishGame(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  const { data: game } = await supabase
    .from("games")
    .select("status, platform")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .single()

  if (!game) return { error: "Juego no encontrado o no autorizado" }
  if (game.status !== "draft") return { error: "El juego ya fue publicado" }

  const { error } = await supabase
    .from("games")
    .update({ status: "pending", rejection_reason: null })
    .eq("id", gameId)

  if (error) return { error: error.message }

  await checkAndAwardBadges(user.id)

  revalidatePath("/perfil/[username]", "page")
  revalidatePath(`/juego/${gameId}`)
  return { success: true }
}

// ─── Admin actions (user management) ──────────────────────────────────────────

export async function getUsers(options: {
  search?: string
  page?: number
  limit?: number
} = {}) {
  await assertAdmin()
  const supabase = await createClient()
  const { search, page = 0, limit = 20 } = options

  let query = supabase
    .from("profiles")
    .select("id, username, email, role, avatar_url, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: users, count } = await query
  return { users: users ?? [], total: count ?? 0 }
}

export async function setUserRole(userId: string, role: 'user' | 'moderator' | 'admin') {
  await assertAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) return { error: error.message }

  revalidatePath("/admin/usuarios")
  revalidatePath("/moderar")
  return { success: true }
}
