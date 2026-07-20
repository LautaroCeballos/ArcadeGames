import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditGameForm } from "@/components/EditGameForm"
import type { Tag } from "@/lib/definitions"

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Fetch the game
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single()

  if (!game) notFound()

  // Verify ownership
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single()

  if (game.user_id !== user.id) {
    redirect(profile?.username ? `/perfil/${profile.username}` : "/")
  }

  // Fetch all tags + current game tags
  const [tagsResult, gameTagsResult] = await Promise.all([
    supabase.from("tags").select("*"),
    supabase.from("game_tags").select("tag_id").eq("game_id", id),
  ])

  const tags = (tagsResult.data ?? []) as Tag[]
  const gameTagIds = gameTagsResult.data?.map((gt: { tag_id: string }) => gt.tag_id) ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar juego</h1>
        <p className="text-sm text-muted-foreground mt-1">{game.title}</p>
      </div>
      <EditGameForm
        game={{
          id: game.id,
          title: game.title,
          description: game.description ?? "",
          thumbnail_url: game.thumbnail_url ?? "",
          embed_url: game.embed_url,
          platform: game.platform ?? 'makecode',
          tagIds: gameTagIds,
        }}
        tags={tags}
        username={profile?.username ?? ""}
      />
    </div>
  )
}
