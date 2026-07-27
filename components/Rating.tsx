"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { toggleStar } from "@/lib/actions/ratings"
import { toast } from "@/hooks/use-toast"
import { Star } from "lucide-react"

interface RatingProps {
  gameId: string
  starsCount: number | null
  hasStarred: boolean | null
}

export function Rating({ gameId, starsCount, hasStarred }: RatingProps) {
  const [starred, setStarred] = useState(hasStarred ?? false)
  const [count, setCount] = useState(starsCount ?? 0)
  const [loading, setLoading] = useState(false)

  const isAuthenticated = hasStarred !== null

  async function handleToggle() {
    if (loading || !isAuthenticated) return

    const wasStarred = starred
    setStarred(!starred)
    setCount(wasStarred ? count - 1 : count + 1)
    setLoading(true)

    const result = await toggleStar(gameId)

    if (result.error) {
      setStarred(wasStarred)
      setCount(wasStarred ? count + 1 : count - 1)
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }

    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading || !isAuthenticated}
      aria-label={starred ? "Quitar estrella" : "Dar estrella"}
      aria-pressed={starred}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
        starred
          ? "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        loading && "pointer-events-none opacity-60",
        !isAuthenticated && "cursor-not-allowed opacity-50",
      )}
    >
      <Star
        className={cn(
          "size-4",
          starred ? "fill-yellow-400 text-yellow-400" : "fill-none",
        )}
      />
      {count}
    </button>
  )
}
