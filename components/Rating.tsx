"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { rateGame } from "@/lib/actions/ratings"
import { toast } from "@/hooks/use-toast"

interface RatingProps {
  gameId: string
  avgRating: number | null
  userRating: number | null
  totalVotes?: number
}

export function Rating({ gameId, avgRating, userRating }: RatingProps) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(userRating ?? 0)
  const [loading, setLoading] = useState(false)

  async function handleRate(value: number) {
    if (loading) return
    setSelected(value)
    setLoading(true)

    const result = await rateGame(gameId, value)

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      setSelected(selected)
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={loading}
            className={cn(
              "text-xl transition-colors",
              loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-110"
            )}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(star)}
          >
            <span
              className={
                (hovered || selected) >= star
                  ? "text-yellow-500"
                  : "text-muted-foreground/30"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
      {avgRating && (
        <p className="text-xs text-muted-foreground">
          Promedio: {avgRating} / 5
        </p>
      )}
    </div>
  )
}
