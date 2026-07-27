import Link from "next/link"
import { Star, Eye, Flame } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCount } from "@/lib/utils"
import { getTagColor } from "@/lib/tag-colors"
import { PlatformBadge } from "@/components/PlatformBadge"
import type { FeaturedGameData } from "@/lib/definitions"

/* ─── FeaturedCard (inline) ──────────────────────────────── */

interface FeaturedCardProps {
  game: FeaturedGameData
}

function FeaturedCard({ game }: FeaturedCardProps) {
  const categoryTag = game.tags?.find(
    (t) => t.name !== "MakeCode Arcade" && t.name !== "Scratch",
  )

  return (
    <Link
      href={`/juego/${game.id}`}
      className="group block overflow-hidden rounded-[10px] transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
    >
      {/* Image area */}
      <div className="relative aspect-video">
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

        {/* Platform badge — floating top-left */}
        <PlatformBadge platform={game.platform} />

        {/* Category tag bubble — floating top-right on image */}
        {categoryTag && (
          <span
            className="absolute right-2 top-2 z-10 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{
              backgroundColor: getTagColor(categoryTag.name).badge,
              opacity: 0.92,
            }}
          >
            {categoryTag.name}
          </span>
        )}
      </div>

      {/* Info panel — below image */}
      <div className="flex flex-col gap-0.5 bg-[#1a1a2e] px-3 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {game.title}
          </p>
          {game.stars_count !== null && (
            <span className="flex flex-shrink-0 items-center gap-1 text-xs text-white/80">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {game.stars_count}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-white/60">
            {game.author ? `Por ${game.author}` : ''}
          </span>
          <span className="flex flex-shrink-0 items-center gap-1 text-xs text-white/80">
            <Eye className="h-3 w-3" />
            {formatCount(game.views)}
          </span>
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
          <Flame className="mr-2 inline-block h-6 w-6 text-arcade-red" />
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
          <div key={i} className="overflow-hidden rounded-[10px]">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-[52px] w-full" />
          </div>
        ))}
      </div>
    </section>
  )
}
