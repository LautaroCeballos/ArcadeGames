import Link from "next/link"
import { Trophy, Star, Gamepad2, Users } from "lucide-react"
import type { PlayerRankingEntry } from "@/lib/definitions"

interface PodiumCardProps {
  topPlayers: PlayerRankingEntry[]
}

const podiumColors = [
  { bg: "bg-amber-50 dark:bg-amber-900", border: "border-amber-300 dark:border-amber-600", text: "text-amber-500 dark:text-amber-400", rank: "1" },
  { bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-300 dark:border-gray-600", text: "text-gray-400 dark:text-gray-300", rank: "2" },
  { bg: "bg-orange-50 dark:bg-orange-900", border: "border-orange-300 dark:border-orange-600", text: "text-orange-500 dark:text-orange-400", rank: "3" },
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
    <div className="flex justify-center items-end gap-0">
      {ordered.map((player, i) => {
        if (!player) {
          return (
            <div key={`empty-${i}`} className="min-h-[120px] sm:min-h-[140px]" />
          )
        }

        const isCenter = i === 1
        const isLeft = i === 0
        const colors = isCenter ? podiumColors[0] : isLeft ? podiumColors[1] : podiumColors[2]
        const trophyColor = isCenter ? trophyColors[0] : isLeft ? trophyColors[1] : trophyColors[2]

        // Podium step: spacer above pushes 2nd/3rd down
        const spacerHeight = isCenter ? "h-0" : isLeft ? "h-8 sm:h-10" : "h-14 sm:h-20"

        // Overlap: negative margins so cards overlap slightly; center on top
        const overlapMargin = isCenter
          ? "mx-[-10px] sm:mx-[-16px]"
          : isLeft
            ? "mr-[-10px] sm:mr-[-16px]"
            : "ml-[-10px] sm:ml-[-16px]"

        const zIndex = isCenter ? "z-10" : "z-[1]"

        // Size progression: 1st biggest, 2nd medium, 3rd smallest
        const cardPadding = isCenter
          ? "px-4 py-5 sm:px-5 sm:py-6"
          : isLeft
            ? "px-3 py-4 sm:px-4 sm:py-5"
            : "px-3 py-3 sm:px-4 sm:py-4"

        const trophySize = isCenter
          ? "size-7 sm:size-9"
          : isLeft
            ? "size-6 sm:size-8"
            : "size-5 sm:size-7"

        const nameSize = isCenter
          ? "text-sm sm:text-base"
          : "text-xs sm:text-sm"

        const starIconSize = isCenter
          ? "size-3.5 sm:size-4"
          : "size-3 sm:size-3.5"

        const starNumberSize = isCenter
          ? "text-sm sm:text-base"
          : "text-xs sm:text-sm"

        return (
          <div
            key={player.username}
            className={`relative flex flex-1 flex-col ${overlapMargin} ${zIndex}`}
          >
            {/* Spacer for podium step effect */}
            <div className={spacerHeight} />

            <div
              className={`relative flex flex-col items-center rounded-[10px] border-2 ${colors.border} ${colors.bg} text-center shadow-sm transition-shadow hover:shadow-md ${cardPadding}`}
            >
              {/* Rank badge */}
              <div
                className={`absolute -top-3 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-white shadow sm:size-8 sm:text-sm ${
                  isCenter ? "bg-amber-400" : isLeft ? "bg-gray-400" : "bg-orange-500"
                }`}
              >
                {colors.rank}
              </div>

              {/* Trophy */}
              <div className="mt-2 flex items-center justify-center sm:mt-3">
                <Trophy className={`${trophySize} ${trophyColor}`} fill="currentColor" />
              </div>

              {/* Username */}
              <Link
                href={`/perfil/${player.username}`}
                className={`mt-2 truncate font-semibold text-foreground hover:text-primary transition-colors max-w-full ${nameSize}`}
              >
                {player.username}
              </Link>

              {/* Stats row */}
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="flex items-center gap-0.5">
                  <Star className={`${starIconSize} fill-yellow-400 text-yellow-400`} />
                  <span className={`font-bold text-foreground ${starNumberSize}`}>{player.totalStars}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <Gamepad2 className={`${starIconSize} text-green-500`} strokeWidth={2.5} />
                  <span className={`font-bold text-foreground ${starNumberSize}`}>{player.gamesCount}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <Users className={`${starIconSize} text-blue-500`} strokeWidth={2.5} />
                  <span className={`font-bold text-foreground ${starNumberSize}`}>{player.followersCount}</span>
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
