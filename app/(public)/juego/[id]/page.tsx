import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Embed */}
      <div className="overflow-hidden rounded-[10px] ring-1 ring-border">
        <ArcadeEmbed url={game.embed_url} title={game.title} />
      </div>

      {/* Title & author */}
      <div>
        <h1 className="text-2xl font-bold text-arcade-dark">{game.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Por {game.profiles?.username ?? "Anónimo"}
        </p>
      </div>

      {/* Badges (category + tags) */}
      <div className="flex flex-wrap items-center gap-2">
        {game.categories && (
          <Badge className="bg-arcade-red text-arcade-beige hover:bg-arcade-red/90">
            {(game.categories as Category).name}
          </Badge>
        )}
        {game.tags.map((tag: { id: string; name: string }) => (
          <Badge key={tag.id} variant="secondary">
            {tag.name}
          </Badge>
        ))}
      </div>

      {/* Description */}
      {game.description && (
        <p className="text-muted-foreground">{game.description}</p>
      )}

      <Separator className="bg-border" />

      {/* Rating */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-arcade-dark">Calificar</h3>
        <Rating
          gameId={game.id}
          avgRating={game.avg_rating}
          userRating={game.user_rating}
        />
      </div>

      {/* Related games */}
      {related && related.length > 0 && (
        <>
          <Separator className="bg-border" />
          <div>
            <h3 className="mb-3 text-sm font-medium text-arcade-dark">
              Juegos relacionados
            </h3>
            <div className="flex flex-wrap gap-2">
              {related.map((r: { id: string; title: string }) => (
                <Link
                  key={r.id}
                  href={`/juego/${r.id}`}
                  className="rounded-[10px] bg-arcade-green/20 px-3 py-2 text-sm text-arcade-dark transition-colors hover:bg-arcade-green/40"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
