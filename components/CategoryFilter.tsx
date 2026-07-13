"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/definitions"

interface CategoryFilterProps {
  categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get("category") ?? ""

  function handleClick(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === active) {
      params.delete("category")
    } else {
      params.set("category", slug)
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
          !active
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-accent"
        )}
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString())
          params.delete("category")
          params.delete("page")
          router.push(`/?${params.toString()}`)
        }}
      >
        Todas
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={cn(
            "px-3 py-1 text-sm rounded-full border transition-colors",
            active === cat.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-accent"
          )}
          onClick={() => handleClick(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
