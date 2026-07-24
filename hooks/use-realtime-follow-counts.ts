"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Hook que se suscribe a cambios Realtime en la tabla `follows`
 * para mantener los contadores de seguidores/siguiendo en vivo.
 *
 * - INSERT (alguien sigue al perfil): incrementa followersCount
 * - DELETE (alguien deja de seguir): decrementa followersCount
 * - Cleanup automático al desmontar.
 */
export function useRealtimeFollowCounts(
  profileUserId: string,
  initialFollowersCount: number,
  initialFollowingCount: number
): {
  followersCount: number
  followingCount: number
} {
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [followingCount, setFollowingCount] = useState(initialFollowingCount)
  const didInit = useRef(false)

  // Aplica datos iniciales solo en el primer montaje
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true
    }
  }, [])

  // Suscripción Realtime
  useEffect(() => {
    if (!profileUserId) return

    const supabase = createClient()

    console.log("[FollowCounts] subscribing for profile:", profileUserId)
    const channel = supabase
      .channel(`follows-${profileUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${profileUserId}`,
        },
        () => {
          console.log("[FollowCounts] INSERT — new follower")
          setFollowersCount((prev) => prev + 1)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${profileUserId}`,
        },
        () => {
          console.log("[FollowCounts] DELETE — lost follower")
          setFollowersCount((prev) => Math.max(0, prev - 1))
        }
      )
      .subscribe((status) => {
        console.log("[FollowCounts] subscribe status:", status)
      })

    return () => {
      console.log("[FollowCounts] cleanup")
      supabase.removeChannel(channel)
    }
  }, [profileUserId])

  return { followersCount, followingCount }
}
