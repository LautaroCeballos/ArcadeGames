import Link from "next/link"
import { Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { FeaturedGameData } from "@/lib/definitions"

/* ─── FeaturedCard (inline) ──────────────────────────────── */

interface FeaturedCardProps {
  game: FeaturedGameData
}

function FeaturedCard({ game }: FeaturedCardProps) {
  return (
    <Link
      href={`/juego/${game.id}`}
      className="group relative block aspect-video overflow-hidden rounded-[10px] transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
    >
      {game.thumbnail_url ? (
        <img
          src={game.thumbnail_url}
          alt={game.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-4xl text-muted-foreground/30">
          🎮
        </div>
      )}

      {/* Dark overlay — bottom ~30% */}
      <div className="absolute bottom-0 left-0 right-0 bg-[rgba(52,54,53,0.96)] px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-arcade-beige">
              {game.title}
            </p>
            {game.author && (
              <p className="truncate text-xs text-arcade-beige/70">
                por {game.author}
              </p>
            )}
          </div>
          {game.stars_count !== null && (
            <span className="flex flex-shrink-0 items-center gap-1 text-xs text-arcade-beige/80">
              <Star className="h-3 w-3 fill-current" />
              {game.stars_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ─── Section ────────────────────────────────────────────── */

interface FeaturedSectionProps {
  games: FeaturedGameData[]
}

export function FeaturedSection({ games }: FeaturedSectionProps) {
  if (games.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[25px] font-semibold text-arcade-dark">
          Juegos Destacados
        </h2>
        <Link
          href="/buscar?sort=rated"
          className="group flex items-center gap-1 text-sm font-medium text-arcade-dark/60 transition-colors hover:text-arcade-red"
        >
          Ver todos
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {games.map((game) => (
          <FeaturedCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}

/* ─── Skeleton ───────────────────────────────────────────── */

export function FeaturedSectionSkeleton() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video rounded-[10px]" />
        ))}
      </div>
    </section>
  )
}
