"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "popular", label: "Más jugados" },
  { value: "rated", label: "Mejor valorados" },
] as const

/**
 * Client component: dropdown to change sort order of the game listing.
 * Updates the `?sort=` URL param, resets page to 0.
 */
export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sort") || "recent"

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    const value = e.target.value

    if (value === "recent") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    params.delete("page") // Reset page on sort change
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative">
      <select
        value={currentSort}
        onChange={handleChange}
        className="appearance-none rounded-[8px] border border-input bg-background px-3 py-1.5 pr-8 text-sm text-muted-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Ordenar juegos"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
