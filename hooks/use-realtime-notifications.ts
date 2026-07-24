"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { AppNotification } from "@/lib/definitions"

/**
 * Hook que se suscribe a cambios Realtime en la tabla `notifications`.
 *
 * - INSERT: prepende la nueva notificación al inicio e incrementa el contador.
 * - UPDATE: actualiza la notificación en el array y ajusta el contador si cambió `read`.
 * - Cleanup automático al desmontar el componente.
 * - Si `userId` es null, no se suscribe (útil para usuarios no autenticados).
 */
export function useRealtimeNotifications(
  userId: string | null,
  initial?: {
    notifications: AppNotification[]
    unreadCount: number
  }
): {
  notifications: AppNotification[]
  unreadCount: number
} {
  const [notifications, setNotifications] = useState<AppNotification[]>(
    initial?.notifications ?? []
  )
  const [unreadCount, setUnreadCount] = useState(initial?.unreadCount ?? 0)
  const didInit = useRef(false)

  // Aplica datos iniciales del servidor SOLO al montar.
  // En subsequentes re-renders del Server Component (navegación),
  // el estado ya está vivo vía Realtime — sobreescribirlo lo rompe.
  useEffect(() => {
    if (!didInit.current && initial) {
      didInit.current = true
    }
  }, [initial])

  // Suscripción Realtime
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    console.log("[Notifications] subscribing for user:", userId)
    const channel = supabase
      .channel("notifications-realtime")
      .on<AppNotification>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new
          console.log("[Notifications] INSERT:", newNotification.id, newNotification.type)
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotification.id)) return prev
            return [newNotification, ...prev]
          })
          if (!newNotification.read) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .on<AppNotification>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new
          const wasUnread = !(payload.old as AppNotification).read
          const isNowRead = updated.read
          console.log("[Notifications] UPDATE:", updated.id, "wasUnread:", wasUnread, "isNowRead:", isNowRead)

          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          )

          if (wasUnread && isNowRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          } else if (!wasUnread && !isNowRead) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .subscribe((status) => {
        console.log("[Notifications] subscribe status:", status)
      })

    return () => {
      console.log("[Notifications] cleanup")
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { notifications, unreadCount }
}
