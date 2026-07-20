"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ArcadeEmbed } from "@/components/ArcadeEmbed"
import { ScratchEmbed } from "@/components/ScratchEmbed"

type TabId = "juego" | "editor"

interface TabDefinition {
  id: TabId
  label: string
  sandbox?: string
}

const MAKECODE_TABS: TabDefinition[] = [
  {
    id: "juego",
    label: "Juego",
  },
  {
    id: "editor",
    label: "Editor",
    sandbox: "allow-popups allow-forms allow-scripts allow-same-origin",
  },
]

const SCRATCH_TABS: TabDefinition[] = [
  {
    id: "juego",
    label: "Juego",
  },
]

interface GameTabsProps {
  gameId: string
  title: string
  platform?: 'makecode' | 'scratch'
  embedUrl?: string
}

export function GameTabs({ gameId, title, platform = 'makecode', embedUrl }: GameTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("juego")

  const isMakeCode = platform === 'makecode'
  const tabs = isMakeCode ? MAKECODE_TABS : SCRATCH_TABS

  const getSrc = (tab: TabId): string => {
    if (!isMakeCode) {
      // For Scratch, use the embedUrl directly
      return embedUrl ?? `https://scratch.mit.edu/projects/${gameId.replace("scratch_", "")}/embed`
    }
    switch (tab) {
      case "juego":
        return `https://arcade.makecode.com/---run?id=${gameId}`
      case "editor":
        return `https://arcade.makecode.com/#pub:${gameId}`
    }
  }

  const renderEmbed = () => {
    if (isMakeCode) {
      return (
        <ArcadeEmbed
          key={activeTab}
          url={getSrc(activeTab)}
          title={title}
          sandbox={MAKECODE_TABS.find((t) => t.id === activeTab)?.sandbox}
        />
      )
    }
    return (
      <ScratchEmbed
        url={getSrc("juego")}
        title={title}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-[10px] ring-1 ring-border">
      {/* Tab content */}
      {renderEmbed()}

      {/* Tab bar (debajo del embed) */}
      <div className="flex border-t border-border bg-background">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-arcade-dark"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-arcade-red" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
