"use client"

import { useState } from "react"
import { getGames } from "@/lib/actions/games"
import { GameCard } from "@/components/GameCard"
import { Button } from "@/components/ui/button"
import type { GameWithDetails } from "@/lib/definitions"

interface LoadMoreGamesProps {
  initialGames: GameWithDetails[]
  total: number
  search?: string
  categoryId?: string
}

export function LoadMoreGames({ initialGames, total, search, categoryId }: LoadMoreGamesProps) {
  const [games, setGames] = useState<GameWithDetails[]>(initialGames)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasMore = games.length < total

  async function handleLoadMore() {
    setLoading(true)
    setError(null)
    try {
      const nextPage = page + 1
      const result = await getGames({ search, categoryId, page: nextPage })
      setGames((prev) => [...prev, ...result.games])
      setPage(nextPage)
    } catch {
      setError("Error al cargar más juegos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={loading} variant="outline" size="lg">
            {loading ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}
    </div>
  )
}
