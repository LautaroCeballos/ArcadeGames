import { Star } from "lucide-react"
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
      { username: "PepitoGamer", avatarUrl: null, score: 56 },
      { username: "Juancito", avatarUrl: null, score: 50 },
      { username: "LautiGamer", avatarUrl: null, score: 49 },
    ],
  },
  {
    label: "Semana",
    entries: [
      { username: "ProGamer", avatarUrl: null, score: 340 },
      { username: "ArcadeMaster", avatarUrl: null, score: 280 },
      { username: "PixelHero", avatarUrl: null, score: 210 },
    ],
  },
  {
    label: "Mes",
    entries: [
      { username: "RetroKing", avatarUrl: null, score: 1200 },
      { username: "NeonRider", avatarUrl: null, score: 980 },
      { username: "BitWizard", avatarUrl: null, score: 760 },
      { username: "PixelNinja", avatarUrl: null, score: 650 },
      { username: "GameWizard", avatarUrl: null, score: 540 },
      { username: "ArcadeFox", avatarUrl: null, score: 430 },
    ],
  },
  {
    label: "Año",
    entries: [
      { username: "ArcadeLegend", avatarUrl: null, score: 9500 },
      { username: "GameChampion", avatarUrl: null, score: 8700 },
      { username: "ScoreHunter", avatarUrl: null, score: 7800 },
      { username: "RetroMaster", avatarUrl: null, score: 7200 },
      { username: "NeonGamer", avatarUrl: null, score: 6800 },
      { username: "PixelKing", avatarUrl: null, score: 6100 },
    ],
  },
]

function PlayerRow({ entry }: { entry: RankingEntry }) {
  return (
    <div className="flex items-center gap-5">
      {/* Avatar */}
      <div className="flex size-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-arcade-dark/10 text-sm font-bold text-arcade-beige sm:size-12">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.username}
            className="size-full object-cover"
          />
        ) : (
          <span>{entry.username.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <p className="truncate text-base font-medium leading-tight text-arcade-beige sm:text-lg">
          {entry.username}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-arcade-red sm:text-lg">
            {entry.score}
          </span>
          <Star className="size-4 fill-yellow-400 text-yellow-400 sm:size-5" />
        </div>
      </div>
    </div>
  )
}

function RankingCard({ period }: { period: RankingPeriod }) {
  const isDouble = period.entries.length > 3
  const leftEntries = isDouble ? period.entries.slice(0, 3) : period.entries
  const rightEntries = isDouble ? period.entries.slice(3) : []

  return (
    <div className="overflow-hidden rounded-[10px] bg-arcade-green shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      {/* Header */}
      <div className="bg-arcade-red px-5 py-3 text-center">
        <h3 className="text-base font-semibold tracking-wide text-arcade-beige uppercase sm:text-lg">
          {period.label}
        </h3>
      </div>

      {/* Entries */}
      <div
        className={
          isDouble
            ? "grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5"
            : "flex flex-col gap-5 px-5 py-5"
        }
      >
        {leftEntries.map((entry) => (
          <PlayerRow key={entry.username} entry={entry} />
        ))}
        {rightEntries.map((entry) => (
          <PlayerRow key={entry.username} entry={entry} />
        ))}
      </div>
    </div>
    )
}

export function RankingSection() {
  const singlePeriods = mockPeriods.slice(0, 2) // Ayer, Semana
  const doublePeriods = mockPeriods.slice(2) // Mes, Año

  return (
    <section className="space-y-10">
      <h2 className="text-xl font-semibold text-arcade-dark tracking-wide uppercase sm:text-2xl">
        Top de Jugadores
      </h2>

      {/* Row 1: Ayer | Podium | Semana */}
      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-3">
        <div className="max-w-[260px] mx-auto w-full lg:mx-0 lg:max-w-none">
          <RankingCard key={singlePeriods[0].label} period={singlePeriods[0]} />
        </div>
        <PodiumCard />
        <div className="max-w-[260px] mx-auto w-full lg:mx-0 lg:max-w-none">
          <RankingCard key={singlePeriods[1].label} period={singlePeriods[1]} />
        </div>
      </div>

      {/* Row 2: Mes | Año */}
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        {doublePeriods.map((period) => (
          <RankingCard key={period.label} period={period} />
        ))}
      </div>
    </section>
  )
}
