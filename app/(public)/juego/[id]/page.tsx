import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getGameById } from "@/lib/actions/games"
import { isFavorited } from "@/lib/actions/favorites"
import { GameTabs } from "@/components/GameTabs"
import { Rating } from "@/components/Rating"
import { FavoriteButton } from "@/components/FavoriteButton"
import { Eye, ExternalLink } from "lucide-react"
import { formatCount } from "@/lib/utils"
import { buildProjectUrl } from "@/lib/game-utils"
import { getTagColor } from "@/lib/tag-colors"
import { slugifyTagName } from "@/lib/tag-utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrackView } from "@/components/TrackView"
import { getGamesByAuthor, getRelatedGames } from "@/lib/queries/games"
import { GameCard } from "@/components/GameCard"
import type { GameWithDetails } from "@/lib/definitions"

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

  // Check if current user has favorited this game
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const favorited = user ? await isFavorited(id) : false
  const isOwner = user?.id === game.user_id

  // Related games: match first non-platform tag
  const primaryTag = game.tags?.find((t) => t.name !== 'MakeCode Arcade' && t.name !== 'Scratch')
  const relatedGames = primaryTag
    ? await getRelatedGames(primaryTag.id, game.id, 6)
    : []
  const primaryTagSlug = primaryTag ? slugifyTagName(primaryTag.name) : null

  // More games from the same developer
  const authorGames = game.user_id ? await getGamesByAuthor(game.user_id, game.id, 6) : []

  return (
    <>
      <TrackView gameId={game.id} />
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
        <div className="mt-6 space-y-6 lg:mt-0 lg:self-center">
          {/* Title & author */}
          <div>
            <h1 className="text-2xl font-bold text-arcade-dark">{game.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Por{" "}
              {game.profiles?.username ? (
                <Link
                  href={`/perfil/${game.profiles.username}`}
                  className="font-medium text-arcade-dark underline-offset-2 transition-colors hover:text-arcade-red hover:underline"
                >
                  {game.profiles.username}
                </Link>
              ) : (
                "Anónimo"
              )}
            </p>
          </div>

          {/* Badges (platform + tags) with category colors */}
          <div className="-mt-3 flex flex-wrap items-center gap-2">
            {game.tags.map((tag: { id: string; name: string }) => {
              const tc = getTagColor(tag.name)
              return (
                <Link key={tag.id} href={`/buscar?tag=${slugifyTagName(tag.name)}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer font-medium transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: tc.bg,
                      color: tc.icon,
                      borderColor: tc.badgeBorder,
                    }}
                  >
                    {tag.name}
                  </Badge>
                </Link>
              )
            })}
          </div>

          {/* Description */}
          {game.description && (
            <p className="text-muted-foreground">{game.description}</p>
          )}

          {/* Publication date */}
          <p className="text-xs text-muted-foreground/60">
            Publicado el{" "}
            {new Date(game.created_at).toLocaleDateString("es-AR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          {/* Views, Rating & Favorites — single row */}
          <div className="flex flex-wrap items-center gap-2">
            <Rating
              gameId={game.id}
              starsCount={game.stars_count}
              hasStarred={game.has_starred}
            />
            {!isOwner && (
              <FavoriteButton
                gameId={game.id}
                isFavorited={favorited}
                isAuthenticated={!!user}
                favoriteCount={game.favorites_count ?? 0}
              />
            )}
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground">
              <Eye className="size-4" />
              {formatCount(game.views)}
            </div>
            <a
              href={buildProjectUrl(game.id, game.platform)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLink className="size-4" />
              Abrir Proyecto
            </a>
          </div>
        </div>
      </div>

      {/* More games from developer */}
      {authorGames.length > 0 && (
        <section className="mt-10">
          <Separator className="mb-6 bg-border" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-arcade-dark">
              Más juegos de{" "}
              <Link
                href={`/perfil/${game.profiles?.username ?? ""}`}
                className="underline-offset-2 hover:text-arcade-red hover:underline"
              >
                {game.profiles?.username ?? "Anónimo"}
              </Link>
            </h2>
            <Link
              href={`/perfil/${game.profiles?.username ?? ""}`}
              className="group flex items-center gap-1 text-sm font-medium text-arcade-dark/60 transition-colors hover:text-arcade-red"
            >
              Ver más
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {authorGames.slice(0, 4).map((g) => (
              <GameCard key={g.id} game={g as GameWithDetails} />
            ))}
          </div>
        </section>
      )}

      {/* Related games */}
      {relatedGames.length > 0 && (
        <section className="mt-10">
          <Separator className="mb-6 bg-border" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-arcade-dark">
              Juegos relacionados
            </h2>
            {primaryTagSlug && (
              <Link
                href={`/buscar?tag=${primaryTagSlug}`}
                className="group flex items-center gap-1 text-sm font-medium text-arcade-dark/60 transition-colors hover:text-arcade-red"
              >
                Ver más
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {relatedGames.slice(0, 4).map((g) => (
              <GameCard key={g.id} game={g as GameWithDetails} />
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  )
}
