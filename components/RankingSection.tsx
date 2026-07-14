import { Star, Trophy } from "lucide-react"
import { PodiumCard } from "@/components/PodiumCard"

interface RankingEntry {
  username: string
  avatarUrl: string | null
  score: number
}

interface RankingPeriod {
  label: string
  entries: RankingEntry[]
}

/** Mock data — replace with real queries when player ranking data is available */
const mockPeriods: RankingPeriod[] = [
  {
    label: "Ayer",
    entries: [
      { username: "Jugador1", avatarUrl: null, score: 1250 },
      { username: "Jugador2", avatarUrl: null, score: 980 },
      { username: "Jugador3", avatarUrl: null, score: 720 },
    ],
  },
  {
    label: "Semana",
    entries: [
      { username: "ProGamer", avatarUrl: null, score: 5400 },
      { username: "ArcadeMaster", avatarUrl: null, score: 4200 },
      { username: "PixelHero", avatarUrl: null, score: 3100 },
    ],
  },
  {
    label: "Mes",
    entries: [
      { username: "RetroKing", avatarUrl: null, score: 18200 },
      { username: "NeonRider", avatarUrl: null, score: 15600 },
      { username: "BitWizard", avatarUrl: null, score: 12300 },
    ],
  },
  {
    label: "Año",
    entries: [
      { username: "ArcadeLegend", avatarUrl: null, score: 95000 },
      { username: "GameChampion", avatarUrl: null, score: 87000 },
      { username: "ScoreHunter", avatarUrl: null, score: 78000 },
    ],
  },
]

function RankingCard({ period }: { period: RankingPeriod }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] bg-arcade-green">
      {/* Header */}
      <div className="bg-arcade-red px-4 py-2.5 text-center">
        <h3 className="text-sm font-semibold text-arcade-beige">{period.label}</h3>
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-3 px-4 py-4">
        {period.entries.map((entry, i) => (
          <div key={entry.username} className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-arcade-dark/10 text-sm font-bold text-arcade-dark sm:h-[63px] sm:w-[63px]">
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={entry.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg sm:text-xl">
                  {entry.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-arcade-dark">
                {entry.username}
              </p>
              <div className="flex items-center gap-1 text-xs text-arcade-dark/70">
                <Trophy className="h-3 w-3" />
                <span>{entry.score.toLocaleString()} pts</span>
              </div>
            </div>

            {/* Position indicator */}
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-arcade-dark/10 text-xs font-bold text-arcade-dark">
              {i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RankingSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-[25px] font-semibold text-arcade-dark">
        Ranking de Jugadores
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Period cards */}
        {mockPeriods.slice(0, 2).map((period) => (
          <RankingCard key={period.label} period={period} />
        ))}

        {/* Podium */}
        <PodiumCard />

        {/* Remaining period cards */}
        {mockPeriods.slice(2).map((period) => (
          <RankingCard key={period.label} period={period} />
        ))}
      </div>
    </section>
  )
}
