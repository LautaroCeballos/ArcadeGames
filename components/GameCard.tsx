import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GameWithDetails } from "@/lib/definitions"

interface GameCardProps {
  game: GameWithDetails
}

export function GameCard({ game }: GameCardProps) {
  const rating = game.avg_rating

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/juego/${game.id}`}>
        <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
          {game.thumbnail_url ? (
            <img
              src={game.thumbnail_url}
              alt={game.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-4xl text-muted-foreground/30">🎮</div>
          )}
        </div>
        <CardContent className="p-3 space-y-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">
            {game.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{game.profiles?.username ?? "Anónimo"}</span>
            {rating && (
              <span className="flex items-center gap-0.5">
                ★ {rating}
              </span>
            )}
          </div>
          {game.categories && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {game.categories.name}
            </Badge>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
