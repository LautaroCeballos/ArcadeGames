import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getProfileByUsername } from "@/lib/actions/profile"
import { isFollowing } from "@/lib/actions/social"
import { getUserFavorites } from "@/lib/actions/favorites"
import { ProfileHeader } from "@/components/ProfileHeader"
import { ProfileTabs } from "@/components/ProfileTabs"
import type { GameWithDetails, Game, Tag, UserRole } from "@/lib/definitions"
import type { Profile } from "@/lib/definitions"

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle()

  if (!profile) return { title: "Perfil no encontrado" }

  return {
    title: `Perfil de ${profile.username}`,
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isOwner = user?.id === profile.id

  // Check if viewer is moderator/admin
  let viewerRole: UserRole = 'user'
  if (user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    viewerRole = (viewerProfile?.role ?? 'user') as UserRole
  }

  const isModOrAdmin = viewerRole === 'moderator' || viewerRole === 'admin'

  const [gamesResult, following] = await Promise.all([
    supabase
      .from("games")
      .select("*, profiles!games_user_id_fkey(username, avatar_url)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    isFollowing(profile.id),
  ])

  let gamesData = (gamesResult.data ?? []) as Game[]

  // Moderators/admins can see all games; regular users only see approved + visible
  if (!isOwner && !isModOrAdmin) {
    gamesData = gamesData.filter((g) => g.status === "approved" && !g.hidden)
  }

  // Attach tags
  const gameIds = gamesData.map((g) => g.id)
  const tagsMap = new Map<string, Tag[]>()
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

  let games = gamesData.map((g) => ({
    ...g,
    tags: tagsMap.get(g.id) ?? [],
    stars_count: null,
    has_starred: null,
  })) as unknown as GameWithDetails[]

  if (games.length > 0) {
    const { data: ratings } = await supabase
      .from("ratings")
      .select("game_id, value")
      .in("game_id", games.map((g) => g.id))

    const ratingMap = new Map<string, number>()
    for (const r of ratings ?? []) {
      ratingMap.set(r.game_id, (ratingMap.get(r.game_id) ?? 0) + 1)
    }

    games = games.map((g) => {
      const count = ratingMap.get(g.id) ?? 0
      return {
        ...g,
        stars_count: count > 0 ? count : null,
      }
    }) as unknown as GameWithDetails[]
  }

  // Attach favorites count
  if (games.length > 0) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("game_id")
      .in("game_id", games.map((g) => g.id))

    const favMap = new Map<string, number>()
    for (const f of favs ?? []) {
      favMap.set(f.game_id, (favMap.get(f.game_id) ?? 0) + 1)
    }

    games = games.map((g) => ({
      ...g,
      favorites_count: favMap.get(g.id) ?? 0,
    })) as unknown as GameWithDetails[]
  }

  // Load favorited games only for the profile owner
  const favoritedGames = isOwner ? await getUserFavorites(username) : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <ProfileHeader profile={profile} isOwnProfile={isOwner} isFollowing={following} isAuthenticated={!!user} />
      <ProfileTabs
        games={games}
        badges={profile.badges}
        isOwner={isOwner}
        isModOrAdmin={isModOrAdmin}
        favoritedGames={favoritedGames}
      />
    </div>
  )
}
