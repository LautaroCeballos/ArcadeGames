"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { slugifyTagName } from "@/lib/tag-utils"
import { getTagColor } from "@/lib/tag-colors"
import type { Tag } from "@/lib/definitions"

interface TagFilterProps {
  tags: Tag[]
}

export function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSlug = searchParams.get("tag") ?? ""

  /** Ensure browse mode stays active: if no tag and no sort remain, default to "recent" */
  function keepBrowseMode(params: URLSearchParams) {
    if (!params.get("tag") && !params.get("sort")) {
      params.set("sort", "recent")
    }
  }

  function handleClick(tag: Tag) {
    const slug = slugifyTagName(tag.name)
    const params = new URLSearchParams(searchParams.toString())
    if (slug === activeSlug) {
      params.delete("tag")
    } else {
      params.set("tag", slug)
    }
    params.delete("page")
    keepBrowseMode(params)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={cn(
          "px-3 py-1 text-sm rounded-full transition-colors",
          !activeSlug
            ? "border-2 font-medium border-primary text-primary"
            : "border bg-background hover:bg-accent"
        )}
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString())
          params.delete("tag")
          params.delete("page")
          keepBrowseMode(params)
          router.push(`${pathname}?${params.toString()}`)
        }}
      >
        Todas
      </button>
      {tags.map((tag) => {
        const slug = slugifyTagName(tag.name)
        const tc = getTagColor(tag.name)
        const isActive = activeSlug === slug
        return (
          <button
            key={tag.id}
            type="button"
            className={cn(
              "px-3 py-1 text-sm rounded-full transition-colors",
              isActive ? "border-2 font-medium" : "border bg-background hover:bg-accent"
            )}
            style={isActive ? { borderColor: tc.badge, color: tc.badge } : {}}
            onClick={() => handleClick(tag)}
          >
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
