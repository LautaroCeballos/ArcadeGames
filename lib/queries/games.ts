/**
 * Server-side read queries for games.
 *
 * These are NOT server actions (no `"use server"`). They are plain async functions
 * that use `createClient()` and are called directly from Server Components.
 *
 * Separated from mutations in `lib/actions/games.ts` to keep concerns clean.
 */

import { createClient } from "@/lib/supabase/server"
import { slugifyTagName } from "@/lib/tag-utils"
import type { Game, Profile, Tag, FeaturedGameData, RecentGameData } from "@/lib/definitions"

/* ─── Featured games ─────────────────────────────────────── */

/**
 * Returns the top N games by star count.
 * If fewer than `limit` games have stars, falls back to most viewed.
 */
export async function getFeaturedGames(limit = 4): Promise<FeaturedGameData[]> {
  const supabase = await createClient()

  // 1. Get approved + visible games
  const { data: games } = await supabase
    .from("games")
    .select("id, title, thumbnail_url, profiles!games_user_id_fkey(username)")
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!games || games.length === 0) return []

  const gameIds = games.map((g) => g.id)

  // 2. Count stars per game
  const { data: ratings } = await supabase
    .from("ratings")
    .select("game_id")
    .in("game_id", gameIds)

  const starCounts = new Map<string, number>()
  for (const r of ratings ?? []) {
    starCounts.set(r.game_id, (starCounts.get(r.game_id) ?? 0) + 1)
  }

  // 3. Attach stars and sort
  const withStars = games
    .map((g: Record<string, unknown>) => {
      const profileData = g.profiles as { username?: string } | null
      return {
        id: g.id as string,
        title: g.title as string,
        thumbnail_url: (g.thumbnail_url as string) ?? null,
        author: profileData?.username ?? null,
        stars_count: starCounts.get(g.id as string) ?? null,
      }
    })
    .sort((a, b) => (b.stars_count ?? 0) - (a.stars_count ?? 0))

  // 4. Filter to only games with stars, pad with most viewed if needed
  const starred = withStars.filter((g) => g.stars_count !== null && g.stars_count > 0)

  if (starred.length >= limit) {
    return starred.slice(0, limit)
  }

  // Fallback: fill remaining with most viewed
  const remaining = limit - starred.length
  const { data: mostViewed } = await supabase
    .from("games")
    .select("id, title, thumbnail_url, profiles!games_user_id_fkey(username)")
    .eq("status", "approved")
    .eq("hidden", false)
    .order("views", { ascending: false })
    .limit(remaining + starred.length)

  const starredIds = new Set(starred.map((g) => g.id))
  const fallback = (mostViewed ?? [])
    .filter((g) => !starredIds.has(g.id))
    .slice(0, remaining)
    .map((g: Record<string, unknown>) => {
      const profileData = g.profiles as { username?: string } | null
      return {
        id: g.id as string,
        title: g.title as string,
        thumbnail_url: (g.thumbnail_url as string) ?? null,
        author: profileData?.username ?? null,
        stars_count: null,
      }
    })

  return [...starred, ...fallback]
}

/* ─── Recent / new games ─────────────────────────────────── */

/**
 * Returns the most recently approved games with author & platform info.
 */
export async function getRecentGames(limit = 3): Promise<RecentGameData[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("games")
    .select("id, title, thumbnail_url, platform, profiles!games_user_id_fkey(username)")
    .eq("status", "approved")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((g: Record<string, unknown>) => {
    const profileData = g.profiles as { username?: string } | null
    return {
      id: g.id as string,
      title: g.title as string,
      thumbnail_url: (g.thumbnail_url as string) ?? null,
      author: profileData?.username ?? null,
      stars_count: null,
      platform: g.platform as "makecode" | "scratch",
    }
  })
}

/* ─── Full game listing (with sort & pagination) ─────────── */

export interface GameListOptions {
  search?: string
  tagIds?: string[]
  sort?: "recent" | "popular" | "rated"
  page?: number
  limit?: number
}

/**
 * Returns paginated games with optional search, tag filter, and sorting.
 * Called from the Server Component for the "Todos los juegos" section.
 */
export async function getGameList(options: GameListOptions = {}) {
  const supabase = await createClient()
  const { search, tagIds, sort = "recent", page = 0, limit = 12 } = options

  let query = supabase
    .from("games")
    .select("*, profiles!games_user_id_fkey(username, avatar_url)", { count: "exact" })
    .eq("status", "approved")
    .eq("hidden", false)

  // Ordering
  if (sort === "recent") {
    query = query.order("created_at", { ascending: false })
  } else if (sort === "popular") {
    query = query.order("views", { ascending: false })
  }
  // "rated" is handled after fetch

  query = query.range(page * limit, (page + 1) * limit - 1)

  // Search filter
  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  // Tag filter (intersection: game must have ALL specified tags)
  if (tagIds && tagIds.length > 0) {
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

  const rawGames = data as Record<string, unknown>[]

  // Fetch tags per game
  const tagsMap = await fetchTagsForGames(rawGames.map((g) => g.id as string), supabase)

  let result = rawGames.map((g) => ({
    id: g.id as string,
    user_id: g.user_id as string | null,
    title: g.title as string,
    description: g.description as string | null,
    embed_url: g.embed_url as string,
    thumbnail_url: g.thumbnail_url as string | null,
    status: g.status as Game["status"],
    hidden: g.hidden as boolean,
    created_at: g.created_at as string,
    views: g.views as number,
    platform: g.platform as "makecode" | "scratch",
    rejection_reason: g.rejection_reason as string | null,
    profiles: g.profiles as Pick<Profile, "username" | "avatar_url"> | null,
    tags: tagsMap.get(g.id as string) ?? [],
    stars_count: null as number | null,
    has_starred: null as boolean | null,
    is_favorited: null as boolean | null,
  }))

  // For "rated" sort, count stars and sort
  if (sort === "rated" && result.length > 0) {
    const gameIds = result.map((g) => g.id)
    const { data: ratings } = await supabase
      .from("ratings")
      .select("game_id")
      .in("game_id", gameIds)

    const starCounts = new Map<string, number>()
    for (const r of ratings ?? []) {
      starCounts.set(r.game_id, (starCounts.get(r.game_id) ?? 0) + 1)
    }

    result = result
      .map((g) => ({
        ...g,
        stars_count: starCounts.get(g.id) ?? null,
      }))
      .sort((a, b) => (b.stars_count ?? 0) - (a.stars_count ?? 0))
  }

  return { games: result, total: count ?? 0 }
}

/* ─── Tags ───────────────────────────────────────────────── */

/**
 * Returns all non-platform tags for the tag filter.
 */
export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient()

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .not("name", "in", '("MakeCode Arcade","Scratch")')
    .order("name", { ascending: true })

  return tags ?? []
}

/**
 * Returns ALL tags including platform tags (for CategoryExplorer).
 */
export async function getAllTags(): Promise<Tag[]> {
  const supabase = await createClient()

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true })

  return tags ?? []
}

/**
 * Given a URL slug like "accion", returns the matching tag ID.
 * Returns null if no tag matches (filters are ignored gracefully).
 */
export async function resolveTagSlug(slug: string): Promise<string | null> {
  const tags = await getAllTags()
  const found = tags.find((t) => slugifyTagName(t.name) === slug)
  return found?.id ?? null
}

/* ─── Helpers ────────────────────────────────────────────── */

async function fetchTagsForGames(
  gameIds: string[],
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, Tag[]>> {
  const tagsMap = new Map<string, Tag[]>()

  if (gameIds.length === 0) return tagsMap

  const { data: gameTags } = await supabase
    .from("game_tags")
    .select("game_id, tags(*)")
    .in("game_id", gameIds)

  for (const gt of gameTags ?? []) {
    const existing = tagsMap.get(gt.game_id) || []
    existing.push((gt as { tags: unknown }).tags as Tag)
    tagsMap.set(gt.game_id, existing)
  }

  return tagsMap
}
