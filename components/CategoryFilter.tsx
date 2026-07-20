"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Tag } from "@/lib/definitions"

interface TagFilterProps {
  tags: Tag[]
}

export function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTag = searchParams.get("tag") ?? ""

  function handleClick(tagId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tagId === activeTag) {
      params.delete("tag")
    } else {
      params.set("tag", tagId)
    }
    params.delete("page")
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={cn(
          "px-3 py-1 text-sm rounded-full border transition-colors",
          !activeTag
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-accent"
        )}
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString())
          params.delete("tag")
          params.delete("page")
          router.push(`/?${params.toString()}`)
        }}
      >
        Todas
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className={cn(
            "px-3 py-1 text-sm rounded-full border transition-colors",
            activeTag === tag.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-accent"
          )}
          onClick={() => handleClick(tag.id)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
}
