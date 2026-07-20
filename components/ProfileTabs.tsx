"use client"

import { useState } from "react"
import type { GameWithDetails, Badge } from "@/lib/definitions"
import { ProfileGameCard } from "./ProfileGameCard"
import { ProfileBadges } from "./ProfileBadges"

interface ProfileTabsProps {
  games: GameWithDetails[]
  badges: { badges: Badge }[]
  isOwner: boolean
}

type Tab = "juegos" | "logros"

export function ProfileTabs({ games, badges, isOwner }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("juegos")

  return (
    <div>
      <div className="flex gap-0 border-b">
        <TabButton active={activeTab === "juegos"} onClick={() => setActiveTab("juegos")}>
          Juegos
          {games.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({games.length})</span>
          )}
        </TabButton>
        {badges.length > 0 && (
          <TabButton active={activeTab === "logros"} onClick={() => setActiveTab("logros")}>
            Logros
            <span className="ml-1.5 text-xs text-muted-foreground">({badges.length})</span>
          </TabButton>
        )}
      </div>

      <div className="pt-4">
        {activeTab === "juegos" && (
          <div className="space-y-3">
            {games.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Este usuario aún no tiene juegos publicados</p>
              </div>
            ) : (
              games.map((game) => (
                <ProfileGameCard key={game.id} game={game} isOwner={isOwner} />
              ))
            )}
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
