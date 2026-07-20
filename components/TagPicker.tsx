"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import { Check, Lock } from "lucide-react"

const TAG_COLORS = [
  "bg-red-500/15 text-red-600 border-red-300 hover:border-red-400 data-[selected=true]:bg-red-500 data-[selected=true]:text-white data-[selected=true]:border-red-500",
  "bg-orange-500/15 text-orange-600 border-orange-300 hover:border-orange-400 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white data-[selected=true]:border-orange-500",
  "bg-amber-500/15 text-amber-700 border-amber-300 hover:border-amber-400 data-[selected=true]:bg-amber-500 data-[selected=true]:text-white data-[selected=true]:border-amber-500",
  "bg-green-500/15 text-green-600 border-green-300 hover:border-green-400 data-[selected=true]:bg-green-500 data-[selected=true]:text-white data-[selected=true]:border-green-500",
  "bg-teal-500/15 text-teal-600 border-teal-300 hover:border-teal-400 data-[selected=true]:bg-teal-500 data-[selected=true]:text-white data-[selected=true]:border-teal-500",
  "bg-blue-500/15 text-blue-600 border-blue-300 hover:border-blue-400 data-[selected=true]:bg-blue-500 data-[selected=true]:text-white data-[selected=true]:border-blue-500",
  "bg-purple-500/15 text-purple-600 border-purple-300 hover:border-purple-400 data-[selected=true]:bg-purple-500 data-[selected=true]:text-white data-[selected=true]:border-purple-500",
  "bg-pink-500/15 text-pink-600 border-pink-300 hover:border-pink-400 data-[selected=true]:bg-pink-500 data-[selected=true]:text-white data-[selected=true]:border-pink-500",
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
  const hasReachedMax = max !== undefined && selectedIds.length >= max

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
    <div className="flex flex-wrap gap-2.5" role="listbox" aria-label="Seleccionar etiquetas" aria-multiselectable="true">
      {tags.map((tag, idx) => {
        const isSelected = selectedIds.includes(tag.id)
        const isLocked = lockedIds.includes(tag.id)
        const isDisabled = !isSelected && !isLocked && hasReachedMax
        const colorClass = TAG_COLORS[idx % TAG_COLORS.length]

        return (
          <button
            key={tag.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={isDisabled}
            data-selected={isSelected || isLocked}
            onClick={() => handleToggle(tag.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "min-h-[36px]",
              isLocked && "cursor-default opacity-90",
              isDisabled && "cursor-not-allowed opacity-40",
              isSelected || isLocked
                ? colorClass
                : "bg-background text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground hover:shadow-sm",
              !isLocked && !isDisabled && "hover:scale-105 active:scale-95 cursor-pointer"
            )}
          >
            {isLocked && <Lock className="size-3.5 shrink-0" aria-hidden="true" />}
            {isSelected && !isLocked && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
            {tag.name}
            {isLocked && <span className="sr-only">(fijo)</span>}
          </button>
        )
      })}
    </div>
  )
}
