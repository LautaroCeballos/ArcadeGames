import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface NumericPaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  searchParams?: Record<string, string | undefined>
}

/**
 * Server component: renders numeric pagination with <Link> elements (0 JS).
 * Expects `currentPage` to be 0-based from the query, displays as 1-based.
 */
export function NumericPagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: NumericPaginationProps) {
  if (totalPages <= 1) return null

  function buildUrl(page: number): string {
    const params = new URLSearchParams()
    // Carry over existing search params except "page"
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") {
        params.set(key, value)
      }
    }
    if (page > 0) {
      params.set("page", String(page))
    }
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const displayPage = currentPage + 1 // Convert 0-based → 1-based

  // Build page numbers to show
  const pages: (number | "ellipsis")[] = []
  const total = totalPages

  if (total <= 7) {
    // Show all
    for (let i = 0; i < total; i++) pages.push(i)
  } else {
    // Show first, last, and neighbors of current
    pages.push(0)
    if (currentPage > 2) pages.push("ellipsis")

    const start = Math.max(1, currentPage - 1)
    const end = Math.min(total - 2, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < total - 3) pages.push("ellipsis")
    if (total - 1 > 0) pages.push(total - 1)
  }

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1">
      {/* Previous */}
      <Link
        href={buildUrl(currentPage - 1)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[8px] text-sm transition-colors",
          currentPage === 0
            ? "pointer-events-none text-muted-foreground/30"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        aria-disabled={currentPage === 0}
        tabIndex={currentPage === 0 ? -1 : 0}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Anterior</span>
      </Link>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground/50"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-[8px] px-2 text-sm font-medium transition-colors",
              p === currentPage
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p + 1}
          </Link>
        ),
      )}

      {/* Next */}
      <Link
        href={buildUrl(currentPage + 1)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[8px] text-sm transition-colors",
          currentPage >= totalPages - 1
            ? "pointer-events-none text-muted-foreground/30"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        aria-disabled={currentPage >= totalPages - 1}
        tabIndex={currentPage >= totalPages - 1 ? -1 : 0}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Siguiente</span>
      </Link>
    </nav>
  )
}
