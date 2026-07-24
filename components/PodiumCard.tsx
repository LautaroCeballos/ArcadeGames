import { Trophy, Star } from "lucide-react"
import type { PlayerRankingEntry } from "@/lib/definitions"

interface PodiumCardProps {
  topPlayers: PlayerRankingEntry[]
}

const podiumColors = [
  { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-500", rank: "1" },
  { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-400", rank: "2" },
  { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-500", rank: "3" },
]

const trophyColors = ["text-amber-400", "text-gray-400", "text-orange-600"]

/**
 * Podium display for top 3 players.
 * 2nd place | 1st place (featured) | 3rd place
 */
export function PodiumCard({ topPlayers }: PodiumCardProps) {
  if (topPlayers.length === 0) return null

  // Arrange: [2nd, 1st, 3rd] — 1st is featured in center
  const ordered: (PlayerRankingEntry | null)[] = [
    topPlayers[1] ?? null,
    topPlayers[0] ?? null,
    topPlayers[2] ?? null,
  ]

  return (
    <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
      {ordered.map((player, i) => {
        if (!player) {
          return (
            <div key={`empty-${i}`} className="min-h-[120px] sm:min-h-[140px]" />
          )
        }

        const isCenter = i === 1
        const colors = isCenter ? podiumColors[0] : i === 0 ? podiumColors[1] : podiumColors[2]
        const trophyColor = isCenter ? trophyColors[0] : i === 0 ? trophyColors[1] : trophyColors[2]

        return (
          <div
            key={player.username}
            className={`relative flex flex-col items-center rounded-[10px] border-2 ${colors.border} ${colors.bg} px-3 py-4 text-center shadow-sm transition-shadow hover:shadow-md sm:px-4 ${
              isCenter ? "scale-105 sm:scale-110" : ""
            }`}
          >
            {/* Rank badge */}
            <div
              className={`absolute -top-3 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-white shadow sm:size-8 sm:text-sm ${
                isCenter ? "bg-arcade-red" : "bg-muted-foreground/60"
              }`}
            >
              {colors.rank}
            </div>

            {/* Trophy */}
            <div className="mt-2 flex size-12 items-center justify-center sm:size-14">
              <Trophy className={`size-7 sm:size-9 ${trophyColor}`} fill="currentColor" />
            </div>

            {/* Username */}
            <p className="mt-2 text-sm font-semibold text-arcade-dark truncate max-w-full sm:text-base">
              {player.username}
            </p>

            {/* Stars */}
            <div className="mt-1 flex items-center gap-1.5">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400 sm:size-4" />
              <span className="text-sm font-bold text-arcade-dark sm:text-base">
                {player.totalStars}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
