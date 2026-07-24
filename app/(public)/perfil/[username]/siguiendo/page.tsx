import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getFollowing } from "@/lib/actions/social"
import { FollowList } from "@/components/FollowList"

interface SiguiendoPageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: SiguiendoPageProps): Promise<Metadata> {
  const { username } = await params
  return { title: `Siguiendo de ${username}` }
}

export default async function SiguiendoPage({ params }: SiguiendoPageProps) {
  const { username } = await params

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const following = await getFollowing(username)

  let followingMap = new Set<string>()
  if (user) {
    const { data: myFollows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)

    for (const f of myFollows ?? []) {
      followingMap.add(f.following_id)
    }
  }

  const users = following.map((f) => f.following)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/perfil/${username}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Perfil
        </Link>
        <h1 className="text-xl font-bold">Siguiendo</h1>
      </div>

      <FollowList
        users={users}
        followingMap={followingMap}
        emptyMessage="Este usuario no sigue a nadie aún"
        currentUserId={user?.id}
      />
    </div>
  )
}
