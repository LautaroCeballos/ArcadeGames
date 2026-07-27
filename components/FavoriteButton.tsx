"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { toggleFavorite } from "@/lib/actions/favorites"
import { toast } from "@/hooks/use-toast"

interface FavoriteButtonProps {
  gameId: string
  isFavorited: boolean
  isAuthenticated: boolean
  favoriteCount: number
}

export function FavoriteButton({ gameId, isFavorited, isAuthenticated, favoriteCount }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(isFavorited)
  const [count, setCount] = useState(favoriteCount)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (loading || !isAuthenticated) return

    const wasFavorited = favorited
    setFavorited(!favorited)
    setCount(wasFavorited ? count - 1 : count + 1)
    setLoading(true)

    const result = await toggleFavorite(gameId)

    if (result.error) {
      setFavorited(wasFavorited)
      setCount(wasFavorited ? count + 1 : count - 1)
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }

    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading || !isAuthenticated}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={favorited}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
        favorited
          ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        loading && "pointer-events-none opacity-60",
        !isAuthenticated && "cursor-not-allowed opacity-50",
      )}
    >
      <Heart
        className={cn(
          "size-4",
          favorited && "fill-red-500 text-red-500",
        )}
      />
      {count}
    </button>
  )
}
