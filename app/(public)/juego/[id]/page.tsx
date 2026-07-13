import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getGameById } from "@/lib/actions/games"
import { ArcadeEmbed } from "@/components/ArcadeEmbed"
import { Rating } from "@/components/Rating"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Category } from "@/lib/definitions"

interface GamePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { id } = await params
  const game = await getGameById(id)

  if (!game) return { title: "Juego no encontrado" }

  return {
    title: game.title,
    description: game.description ?? `Juego de MakeCode Arcade por ${game.profiles?.username ?? "Anónimo"}`,
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params
  const game = await getGameById(id)

  if (!game) notFound()

  const supabase = await createClient()
  const { data: related } = game.categories
    ? await supabase
        .from("games")
        .select("id, title")
        .eq("category_id", (game.categories as Category).id)
        .neq("id", game.id)
        .eq("status", "approved")
        .eq("hidden", false)
        .limit(4)
    : { data: [] }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <ArcadeEmbed url={game.embed_url} title={game.title} />

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{game.title}</h1>
          <p className="text-sm text-muted-foreground">
            Por {game.profiles?.username ?? "Anónimo"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {game.categories && (
            <Badge>{(game.categories as Category).name}</Badge>
          )}
          {game.tags.map((tag: { id: string; name: string }) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>

        {game.description && (
          <p className="text-muted-foreground">{game.description}</p>
        )}

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-2">Calificar</h3>
          <Rating
            gameId={game.id}
            avgRating={game.avg_rating}
            userRating={game.user_rating}
          />
        </div>

        {related && related.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2">Juegos relacionados</h3>
              <div className="flex flex-wrap gap-2">
                {related.map((r: { id: string; title: string }) => (
                  <a
                    key={r.id}
                    href={`/juego/${r.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {r.title}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
