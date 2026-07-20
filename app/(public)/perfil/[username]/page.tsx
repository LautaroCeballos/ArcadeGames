import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getProfileByUsername } from "@/lib/actions/profile"
import { isFollowing } from "@/lib/actions/social"
import { ProfileHeader } from "@/components/ProfileHeader"
import { ProfileTabs } from "@/components/ProfileTabs"
import type { GameWithDetails } from "@/lib/definitions"

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

  const [gamesResult, following] = await Promise.all([
    supabase
      .from("games")
      .select("*, categories(*), profiles(username, avatar_url)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    isFollowing(profile.id),
  ])

  let games = (gamesResult.data ?? []) as unknown as GameWithDetails[]

  if (!isOwner) {
    games = games.filter((g) => g.status === "approved" && !g.hidden)
  }

  if (games.length > 0) {
    const { data: ratings } = await supabase
      .from("ratings")
      .select("game_id, value")
      .in("game_id", games.map((g) => g.id))

    const ratingMap = new Map<string, number[]>()
    for (const r of ratings ?? []) {
      const bucket = ratingMap.get(r.game_id)
      if (bucket) bucket.push(r.value)
      else ratingMap.set(r.game_id, [r.value])
    }

    games = games.map((g) => {
      const vals = ratingMap.get(g.id)
      return {
        ...g,
        avg_rating: vals
          ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
          : null,
      }
    }) as unknown as GameWithDetails[]
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <ProfileHeader profile={profile} isOwnProfile={isOwner} isFollowing={following} />
      <ProfileTabs games={games} badges={profile.badges} isOwner={isOwner} />
    </div>
  )
}
