"use client"

import Link from "next/link"
import { useRef } from "react"
import { Minus, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getTagIcon } from "@/lib/tag-icons"
import { getTagColor } from "@/lib/tag-colors"
import { slugifyTagName } from "@/lib/tag-utils"
import { MakeCodeLogo, ScratchLogo } from "@/components/PlatformBadge"
import type { Tag } from "@/lib/definitions"

/* ─── CategoryCard (inline) ──────────────────────────────── */

interface CategoryCardProps {
  tag: Tag
}

function CategoryCard({ tag }: CategoryCardProps) {
  const color = getTagColor(tag.name)
  const isMakeCode = tag.name === "MakeCode Arcade"
  const isScratch = tag.name === "Scratch"

  const iconContent = isMakeCode ? (
    <MakeCodeLogo className="h-5 w-5" />
  ) : isScratch ? (
    <ScratchLogo className="h-5 w-5" />
  ) : (
    (() => {
      const Icon = getTagIcon(tag.name)
      return <Icon className="h-5 w-5" />
    })()
  )

  return (
    <Link
      href={`/buscar?tag=${slugifyTagName(tag.name)}`}
      className="flex items-center gap-3 rounded-[10px] border bg-card px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-[8px]"
        style={{ backgroundColor: color.bg, color: color.icon }}
      >
        {iconContent}
      </div>
      <span className="text-sm font-medium">{tag.name}</span>
    </Link>
  )
}

/* ─── "Ver más" button ───────────────────────────────────── */

function ShowAllButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-[10px] border border-dashed border-muted-foreground/30 bg-card px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-muted text-muted-foreground">
        <Plus className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        Ver más
      </span>
    </button>
  )
}

/* ─── "Mostrar menos" button ──────────────────────────────── */

function ShowLessButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-[10px] border border-dashed border-muted-foreground/30 bg-card px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-muted text-muted-foreground">
        <Minus className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        Mostrar menos
      </span>
    </button>
  )
}

/* ─── Section ────────────────────────────────────────────── */

interface CategoryExplorerProps {
  tags: Tag[]
  showAll: boolean
  onShowAll: () => void
}

const INITIAL_COUNT = 8

export function CategoryExplorer({ tags, showAll, onShowAll }: CategoryExplorerProps) {
  const sectionRef = useRef<HTMLElement>(null)

  if (tags.length === 0) return null

  const visibleTags = showAll ? tags : tags.slice(0, INITIAL_COUNT)
  const hasMore = tags.length > INITIAL_COUNT

  function handleShowAll() {
    onShowAll()
    // Dejar que React renderice las nuevas cards y luego hacer scroll suave
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    })
  }

  function handleShowLess() {
    onShowAll()
  }

  return (
    <section ref={sectionRef}>
      <h2 className="mb-4 text-[25px] font-semibold text-arcade-dark">
        Explorar por Categoría
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleTags.map((tag) => (
          <CategoryCard key={tag.id} tag={tag} />
        ))}
        {!showAll && hasMore && <ShowAllButton onClick={handleShowAll} />}
        {showAll && <ShowLessButton onClick={handleShowLess} />}
      </div>
    </section>
  )
}

/* ─── Skeleton ───────────────────────────────────────────── */

export function CategoryExplorerSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section>
      <Skeleton className="mb-4 h-7 w-56" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] rounded-[10px]" />
        ))}
      </div>
    </section>
  )
}
