import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getGameById } from "@/lib/actions/games"
import { GameTabs } from "@/components/GameTabs"
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

  const platformLabel = game.platform === 'scratch' ? 'Scratch' : 'MakeCode Arcade'

  return {
    title: game.title,
    description: game.description ?? `Juego de ${platformLabel} por ${game.profiles?.username ?? "Anónimo"}`,
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12">
        {/* Left column — game embed, sticky */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <GameTabs
            gameId={game.id}
            title={game.title}
            platform={game.platform}
            embedUrl={game.embed_url}
          />
        </div>

        {/* Right column — metadata */}
        <div className="mt-6 space-y-6 lg:mt-0">
          {/* Title & author */}
          <div>
            <h1 className="text-2xl font-bold text-arcade-dark">{game.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Por {game.profiles?.username ?? "Anónimo"}
            </p>
          </div>

          {/* Badges (platform + category + tags) */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={game.platform === 'scratch'
                ? 'bg-arcade-green text-white hover:bg-arcade-green/90'
                : 'bg-arcade-red text-arcade-beige hover:bg-arcade-red/90'
              }
            >
              {game.platform === 'scratch' ? 'Scratch' : 'MakeCode'}
            </Badge>
            {game.categories && (
              <Badge variant="secondary">
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
      </div>
    </div>
  )
}
