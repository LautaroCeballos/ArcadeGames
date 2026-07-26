"use client"

import Link from "next/link"
import { Star, Gamepad2, Puzzle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { RecentGameData } from "@/lib/definitions"

/* ─── RecentProjectCard (inline) ─────────────────────────── */

interface RecentProjectCardProps {
  game: RecentGameData
}

function PlatformIcon({ platform }: { platform: "makecode" | "scratch" }) {
  if (platform === "scratch") {
    return <Puzzle className="h-3 w-3" />
  }
  return <Gamepad2 className="h-3 w-3" />
}

function RecentProjectCard({ game }: RecentProjectCardProps) {
  return (
    <Link
      href={`/juego/${game.id}`}
      className="group flex items-start gap-3 rounded-[10px] p-2 transition-colors hover:bg-accent/50"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-[8px]">
        {game.thumbnail_url ? (
          <img
            src={game.thumbnail_url}
            alt={game.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-lg text-muted-foreground/30">
            🎮
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {game.title}
        </p>
        {game.author && (
          <p className="truncate text-xs text-muted-foreground">
            por {game.author}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <PlatformIcon platform={game.platform} />
            {game.platform === "makecode" ? "MakeCode" : "Scratch"}
          </span>
          {game.stars_count !== null && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              {game.stars_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ─── Section ────────────────────────────────────────────── */

interface RecentProjectsSectionProps {
  games: RecentGameData[]
  showAll?: boolean
}

const DEFAULT_COUNT = 3

export function RecentProjectsSection({ games, showAll = false }: RecentProjectsSectionProps) {
  const visibleGames = showAll ? games : games.slice(0, DEFAULT_COUNT)
  if (visibleGames.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[25px] font-semibold text-arcade-dark">
          Novedades
        </h2>
        <Link
          href="/buscar?sort=recent"
          className="group flex items-center gap-1 text-sm font-medium text-arcade-dark/60 transition-colors hover:text-arcade-red"
        >
          Ver todos
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
      <div className="divide-y divide-border rounded-[10px] border bg-card">
        {visibleGames.map((game) => (
          <RecentProjectCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}

/* ─── Skeleton ───────────────────────────────────────────── */

export function RecentProjectsSectionSkeleton() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="space-y-2 rounded-[10px] border p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-16 w-28 flex-shrink-0 rounded-[8px]" />
            <div className="flex-1 space-y-1.5 pt-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
