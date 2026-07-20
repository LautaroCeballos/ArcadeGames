"use client"

import { useState, useId, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Lock, X, Search } from "lucide-react"

const TAG_COLORS = [
  "bg-red-500/15 text-red-600 border-red-300 data-[selected=true]:bg-red-500 data-[selected=true]:text-white data-[selected=true]:border-red-500",
  "bg-orange-500/15 text-orange-600 border-orange-300 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white data-[selected=true]:border-orange-500",
  "bg-amber-500/15 text-amber-700 border-amber-300 data-[selected=true]:bg-amber-500 data-[selected=true]:text-white data-[selected=true]:border-amber-500",
  "bg-green-500/15 text-green-600 border-green-300 data-[selected=true]:bg-green-500 data-[selected=true]:text-white data-[selected=true]:border-green-500",
  "bg-teal-500/15 text-teal-600 border-teal-300 data-[selected=true]:bg-teal-500 data-[selected=true]:text-white data-[selected=true]:border-teal-500",
  "bg-blue-500/15 text-blue-600 border-blue-300 data-[selected=true]:bg-blue-500 data-[selected=true]:text-white data-[selected=true]:border-blue-500",
  "bg-purple-500/15 text-purple-600 border-purple-300 data-[selected=true]:bg-purple-500 data-[selected=true]:text-white data-[selected=true]:border-purple-500",
  "bg-pink-500/15 text-pink-600 border-pink-300 data-[selected=true]:bg-pink-500 data-[selected=true]:text-white data-[selected=true]:border-pink-500",
]

interface TagPickerProps {
  tags: { id: string; name: string }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  lockedIds?: string[]
  max?: number
}

export function TagPicker({ tags, selectedIds, onChange, lockedIds = [], max }: TagPickerProps) {
  const uid = useId()
  const [search, setSearch] = useState("")
  const hasReachedMax = max !== undefined && selectedIds.length >= max

  const lockedTags = useMemo(
    () => tags.filter((t) => lockedIds.includes(t.id)),
    [tags, lockedIds]
  )

  const selectedTags = useMemo(
    () => tags.filter((t) => selectedIds.includes(t.id) && !lockedIds.includes(t.id)),
    [tags, selectedIds, lockedIds]
  )

  const availableTags = useMemo(
    () => tags.filter((t) => !selectedIds.includes(t.id) && !lockedIds.includes(t.id)),
    [tags, selectedIds, lockedIds]
  )

  const filteredAvailable = useMemo(
    () => availableTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [availableTags, search]
  )

  function getColor(tagId: string) {
    const idx = tags.findIndex((t) => t.id === tagId)
    return TAG_COLORS[idx >= 0 ? idx % TAG_COLORS.length : 0]
  }

  function handleToggle(tagId: string) {
    if (lockedIds.includes(tagId)) return
    const isSelected = selectedIds.includes(tagId)
    if (isSelected) {
      onChange(selectedIds.filter((id) => id !== tagId))
    } else {
      if (hasReachedMax) return
      onChange([...selectedIds, tagId])
    }
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          id={`${uid}-search`}
          type="text"
          placeholder="Buscar etiquetas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Selected tags at top */}
      {(lockedTags.length > 0 || selectedTags.length > 0) && (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Etiquetas seleccionadas">
          {lockedTags.map((tag) => (
            <span
              key={tag.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                getColor(tag.id)
              )}
            >
              <Lock className="size-3" aria-hidden="true" />
              {tag.name}
            </span>
          ))}
          {selectedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggle(tag.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80",
                getColor(tag.id)
              )}
            >
              {tag.name}
              <X className="size-3" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {/* Available tags */}
      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Seleccionar etiquetas" aria-multiselectable="true">
        {filteredAvailable.length === 0 && search && (
          <p className="w-full text-xs text-muted-foreground py-2 text-center">
            No se encontraron etiquetas
          </p>
        )}
        {filteredAvailable.map((tag) => {
          const isDisabled = hasReachedMax

          return (
            <button
              key={tag.id}
              type="button"
              role="option"
              aria-selected={false}
              disabled={isDisabled}
              onClick={() => handleToggle(tag.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "min-h-[36px]",
                isDisabled && "cursor-not-allowed opacity-40",
                "bg-background text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground hover:shadow-sm",
                !isDisabled && "hover:scale-105 active:scale-95 cursor-pointer"
              )}
            >
              {tag.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
