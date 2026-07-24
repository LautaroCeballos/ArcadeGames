import { Star, Gamepad2 } from "lucide-react"
import { PodiumCard } from "@/components/PodiumCard"
import type { PlayerRankingEntry } from "@/lib/definitions"

interface RankingSectionProps {
  players: PlayerRankingEntry[]
}

function RankingList({ players }: { players: PlayerRankingEntry[] }) {
  const list = players.slice(3) // Everything after podium

  if (list.length === 0) return null

  return (
    <div className="divide-y divide-border overflow-hidden rounded-[10px] border bg-card shadow-sm">
      {list.map((player, i) => {
        const rank = i + 4 // 4-based

        return (
          <div
            key={player.username}
            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-5 sm:py-3.5"
          >
            {/* Rank */}
            <span className="w-6 text-center text-sm font-bold text-muted-foreground sm:w-8 sm:text-base">
              #{rank}
            </span>

            {/* Avatar */}
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-arcade-dark/10 text-sm font-bold text-arcade-dark sm:size-10">
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={player.username}
                  className="size-full object-cover"
                />
              ) : (
                <span>{player.username.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                  {player.username}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="size-3" />
                    {player.gamesCount} {player.gamesCount === 1 ? "juego" : "juegos"}
                  </span>
                  {player.rankedGames > 0 && (
                    <span>
                      {player.rankedGames} con estrellas
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold text-foreground sm:text-base">
                  {player.totalStars}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function RankingSection({ players }: RankingSectionProps) {
  const top3 = players.slice(0, 3)

  if (players.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-[25px] font-semibold text-arcade-dark">
          Top de Jugadores
        </h2>
        <div className="flex flex-col items-center gap-2 rounded-[10px] border bg-card py-12 text-center text-muted-foreground shadow-sm">
          <Star className="size-8 text-muted-foreground/40" />
          <p className="text-sm">Aún no hay suficientes ratings para mostrar un ranking.</p>
          <p className="text-xs">¡Votá juegos para que aparezcan acá!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-[25px] font-semibold text-arcade-dark">
        Top de Jugadores
      </h2>

      {/* Podium */}
      <PodiumCard topPlayers={top3} />

      {/* Ranking list (#4+) */}
      <RankingList players={players} />
    </section>
  )
}
