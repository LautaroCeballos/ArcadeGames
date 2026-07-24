"use client"

import { useState, useMemo } from "react"
import type { GameWithDetails, Badge } from "@/lib/definitions"
import { ProfileGameCard } from "./ProfileGameCard"
import { ProfileBadges } from "./ProfileBadges"

interface ProfileTabsProps {
  games: GameWithDetails[]
  badges: { badges: Badge }[]
  isOwner: boolean
  isModOrAdmin?: boolean
}

type Tab = "juegos" | "logros"
type GameFilter = "all" | "approved" | "pending" | "rejected" | "draft"

const gameFilterLabels: Record<GameFilter, string> = {
  all: "Todos los Juegos",
  approved: "Publicados",
  pending: "En moderación",
  rejected: "Rechazados",
  draft: "Borradores",
}

export function ProfileTabs({ games, badges, isOwner, isModOrAdmin = false }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("juegos")
  const [gameFilter, setGameFilter] = useState<GameFilter>("all")

  const filteredGames = useMemo(() => {
    if (gameFilter === "all") return games
    return games.filter((g) => g.status === gameFilter)
  }, [games, gameFilter])

  const gamesByStatus = useMemo(() => ({
    all: games.length,
    approved: games.filter((g) => g.status === "approved").length,
    pending: games.filter((g) => g.status === "pending").length,
    rejected: games.filter((g) => g.status === "rejected").length,
    draft: games.filter((g) => g.status === "draft").length,
  }), [games])

  return (
    <div>
      <div className={isOwner ? "flex gap-0" : "flex gap-0 border-b"}>
        {!isOwner && (
          <TabButton active={activeTab === "juegos"} onClick={() => setActiveTab("juegos")}>
            Juegos
            {games.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({games.length})</span>
            )}
          </TabButton>
        )}
        {badges.length > 0 && (
          <TabButton active={activeTab === "logros"} onClick={() => setActiveTab(activeTab === "logros" ? "juegos" : "logros")}>
            Logros
            <span className="ml-1.5 text-xs text-muted-foreground">({badges.length})</span>
          </TabButton>
        )}
      </div>

      <div className="pt-4">
        {activeTab === "juegos" && (
          <div className="space-y-3">
            {isOwner && (
              <div className="flex gap-1 border-b pb-2">
                {(Object.keys(gameFilterLabels) as GameFilter[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setGameFilter(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
                      gameFilter === key
                        ? "bg-arcade-red/10 text-arcade-red border-b-2 border-arcade-red"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {gameFilterLabels[key]}
                    <span className="ml-1 text-muted-foreground">({gamesByStatus[key]})</span>
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {filteredGames.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>
                    {gameFilter === "all"
                      ? "Este usuario aún no tiene juegos publicados"
                      : `No hay juegos con estado "${gameFilterLabels[gameFilter].toLowerCase()}"`}
                  </p>
                </div>
              ) : (
                filteredGames.map((game) => (
                  <ProfileGameCard key={game.id} game={game} isOwner={isOwner} isModOrAdmin={isModOrAdmin} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "logros" && (
          <ProfileBadges badges={badges} />
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-arcade-red" />
      )}
    </button>
  )
}
