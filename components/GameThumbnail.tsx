import Link from "next/link"
import { Star } from "lucide-react"

export interface GameThumbnailData {
  id: string
  title: string
  thumbnail_url: string | null
  avg_rating: number | null
}

interface GameThumbnailProps {
  game: GameThumbnailData
}

export function GameThumbnail({ game }: GameThumbnailProps) {
  return (
    <Link
      href={`/juego/${game.id}`}
      className="group relative block aspect-video w-[251px] flex-shrink-0 overflow-hidden rounded-[10px] transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
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
        {game.avg_rating !== null && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-arcade-beige/80">
            <Star className="h-3 w-3 fill-current" />
            {game.avg_rating}
          </span>
        )}
      </div>
    </Link>
  )
}
