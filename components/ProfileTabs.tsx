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
  favoritedGames?: GameWithDetails[]
}

type Tab = "juegos" | "logros"
type GameFilter = "all" | "approved" | "pending" | "rejected" | "draft" | "favoritos"

const gameFilterLabels: Record<GameFilter, string> = {
  all: "Todos mis Juegos",
  approved: "Publicados",
  pending: "En moderación",
  rejected: "Rechazados",
  draft: "Borradores",
  favoritos: "Favoritos",
}

export function ProfileTabs({ games, badges, isOwner, isModOrAdmin = false, favoritedGames }: ProfileTabsProps) {
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
    favoritos: favoritedGames?.length ?? 0,
  }), [games, favoritedGames])

  return (
    <div>
      <div className="flex gap-0 border-b">
        {badges.length > 0 && (
          <TabButton active={activeTab === "logros"} onClick={() => setActiveTab(activeTab === "logros" ? "juegos" : "logros")}>
            Logros
            <span className="ml-1.5 text-xs text-muted-foreground">({badges.length})</span>
          </TabButton>
        )}
      </div>

      {activeTab === "juegos" && (
        <div className="pt-4 space-y-3">
          {isOwner && (
            <div className="flex gap-1 border-b pb-2 overflow-x-auto">
              {(Object.keys(gameFilterLabels) as GameFilter[]).map((key) => {
                // Ocultar el filtro "Favoritos" si no tiene juegos favoritos
                if (key === "favoritos" && (!favoritedGames || favoritedGames.length === 0)) return null
                return (
                  <button
                    key={key}
                    onClick={() => setGameFilter(key)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
                      gameFilter === key
                        ? "bg-arcade-red/10 text-arcade-red border-b-2 border-arcade-red"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {gameFilterLabels[key]}
                    <span className="ml-1 text-muted-foreground">({gamesByStatus[key]})</span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="space-y-3">
            {gameFilter === "favoritos" ? (
              favoritedGames && favoritedGames.length > 0 ? (
                favoritedGames.map((game) => (
                  <ProfileGameCard key={game.id} game={game} isOwner={false} showAuthor hideBadge />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aún no tienes juegos favoritos</p>
                </div>
              )
            ) : filteredGames.length === 0 ? (
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
