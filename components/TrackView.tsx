"use client"

import { useEffect, useRef } from "react"
import { incrementGameView } from "@/lib/actions/views"

/**
 * Client component that fires once on mount to increment the game's view count.
 * Uses a ref guard to prevent double-firing in Strict Mode (dev).
 */
export function TrackView({ gameId }: { gameId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    incrementGameView(gameId)
  }, [gameId])

  return null
}
