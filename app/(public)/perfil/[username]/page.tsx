import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getUserGames } from "@/lib/actions/games"
import { GameGrid } from "@/components/GameGrid"

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
  const games = await getUserGames(username)

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle()

  if (!profile) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <span>{profile.username?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold">{profile.username}</h1>
          <p className="text-sm text-muted-foreground">
            {games.length} juego{games.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <GameGrid games={games} />
    </div>
  )
}
