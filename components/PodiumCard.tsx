import { Trophy, Star } from "lucide-react"

const topPlayers = [
  { rank: 1, name: "ArcadeLegend", score: "9500" },
  { rank: 2, name: "GameChampion", score: "8700" },
  { rank: 3, name: "ScoreHunter", score: "7800" },
]

export function PodiumCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] bg-arcade-green shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      {/* Header */}
      <div className="bg-arcade-red px-5 py-3 text-center">
        <h3 className="text-base font-semibold tracking-wide text-arcade-beige uppercase sm:text-lg">
          Podio
        </h3>
      </div>

      {/* Top 3 rows — same format as ranking cards */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:gap-4 sm:py-5">
        {topPlayers.map((p, i) => (
          <div key={p.rank} className="flex items-center gap-4 sm:gap-5">
            {/* Trophy as avatar */}
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-arcade-dark/10 sm:size-12">
              <Trophy
                className={`size-5 sm:size-6 ${
                  i === 0
                    ? "text-amber-400"
                    : i === 1
                      ? "text-gray-400"
                      : "text-orange-600"
                }`}
                fill="currentColor"
              />
            </div>

            {/* Name + Score */}
            <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
              <span className="truncate text-base font-medium leading-tight text-arcade-beige sm:text-lg">
                {p.name}
              </span>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="text-base font-bold text-arcade-red sm:text-lg">
                  {p.score}
                </span>
                <Star className="size-4 fill-yellow-400 text-yellow-400 sm:size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
