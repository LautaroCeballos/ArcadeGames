"use client"

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Tag, RecentGameData } from "@/lib/definitions"
import { CategoryExplorer } from "./CategoryExplorer"
import { RecentProjectsSection } from "./RecentProjectsSection"

/* ─── Skeleton ───────────────────────────────────────────── */

export function CategoryRecentSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div>
        <Skeleton className="mb-4 h-7 w-56" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] rounded-[10px]" />
          ))}
        </div>
      </div>
      <div>
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
      </div>
    </div>
  )
}

interface CategoryRecentSectionProps {
  tags: Tag[]
  recentGames: RecentGameData[]
}

export function CategoryRecentSection({
  tags,
  recentGames,
}: CategoryRecentSectionProps) {
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <CategoryExplorer
        tags={tags}
        showAll={showAll}
        onShowAll={() => setShowAll(true)}
      />
      <RecentProjectsSection games={recentGames} showAll={showAll} />
    </div>
  )
}
