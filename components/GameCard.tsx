import Link from "next/link"
import { Star } from "lucide-react"
import type { GameWithDetails } from "@/lib/definitions"
import { Badge } from "@/components/ui/badge"

interface GameCardProps {
  game: GameWithDetails
}

export function GameCard({ game }: GameCardProps) {
  const rating = game.avg_rating

  return (
    <Link
      href={`/juego/${game.id}`}
      className="group relative block aspect-video overflow-hidden rounded-[10px] transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
    >
      {/* Background image */}
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
        <p className="truncate text-sm font-semibold text-arcade-beige">
          {game.title}
        </p>

        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-xs text-arcade-beige/60">
            {game.profiles?.username ?? "Anónimo"}
          </span>

          {rating !== null && (
            <span className="flex items-center gap-1 text-xs text-arcade-beige/80">
              <Star className="h-3 w-3 fill-current" />
              {rating}
            </span>
          )}
        </div>

        {game.tags && game.tags.length > 0 && (
          <Badge
            variant="secondary"
            className="absolute right-2 top-2 bg-arcade-beige/20 text-[10px] text-arcade-beige"
          >
            {game.tags[0].name}
          </Badge>
        )}
      </div>
    </Link>
  )
}
