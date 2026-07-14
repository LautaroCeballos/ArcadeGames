import { GameThumbnail } from "@/components/GameThumbnail"
import type { GameThumbnailData } from "@/components/GameThumbnail"

interface CuratedSectionProps {
  title: string
  games: GameThumbnailData[]
}

export function CuratedSection({ title, games }: CuratedSectionProps) {
  if (games.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-[25px] font-semibold text-arcade-dark">
        {title}
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-thin">
        {games.map((game) => (
          <div key={game.id} className="snap-start">
            <GameThumbnail game={game} />
          </div>
        ))}
      </div>
    </section>
  )
}

export function CuratedSectionSkeleton() {
  return (
    <section className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video w-[251px] flex-shrink-0 animate-pulse rounded-[10px] bg-muted"
          />
        ))}
      </div>
    </section>
  )
}
