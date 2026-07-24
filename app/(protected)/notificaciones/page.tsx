"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  CheckCircle,
  XCircle,
  Gamepad2,
  Star,
  UserPlus,
  CheckCheck,
  Loader2,
} from "lucide-react"
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AppNotification } from "@/lib/definitions"

const PER_PAGE = 20

function getNotificationIcon(type: string) {
  switch (type) {
    case "game_approved":
      return <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
    case "game_rejected":
      return <XCircle className="h-5 w-5 text-red-400 shrink-0" />
    case "new_game_from_following":
      return <Gamepad2 className="h-5 w-5 text-blue-400 shrink-0" />
    case "new_rating":
      return <Star className="h-5 w-5 text-yellow-400 shrink-0" />
    case "new_follower":
      return <UserPlus className="h-5 w-5 text-purple-400 shrink-0" />
    default:
      return <Bell className="h-5 w-5 text-arcade-beige shrink-0" />
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return "ahora"
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} d`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificacionesPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Realtime subscription — INSERT y UPDATE en vivo
  useEffect(() => {
    const supabase = createClient()
    const channels: ReturnType<typeof supabase.channel>[] = []

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      const channel = supabase
        .channel("notificaciones-page")
        .on<AppNotification>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newN = payload.new
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newN.id)) return prev
              return [newN, ...prev]
            })
            setTotal((prev) => prev + 1)
          }
        )
        .on<AppNotification>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            )
          }
        )
        .subscribe()

      channels.push(channel)
    })

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (loaded) return
    setLoading(true)
    getNotifications({ page: 1, limit: PER_PAGE }).then((result) => {
      setNotifications(result.notifications)
      setTotal(result.total)
      setPage(1)
      setHasMore(result.notifications.length < result.total)
      setLoaded(true)
      setLoading(false)
    })
  }, [loaded])

  // Load more
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const nextPage = page + 1
    const result = await getNotifications({ page: nextPage, limit: PER_PAGE })
    setNotifications((prev) => [...prev, ...result.notifications])
    setPage(nextPage)
    setHasMore(notifications.length + result.notifications.length < total)
    setLoading(false)
  }, [loading, hasMore, page, total, notifications.length])

  const handleClick = async (n: AppNotification) => {
    if (!n.read) {
      await markAsRead(n.id)
      setNotifications((prev) =>
        prev.map((p) => (p.id === n.id ? { ...p, read: true } : p))
      )
    }
    router.push(n.link_url)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications((prev) => prev.map((p) => ({ ...p, read: true })))
    router.refresh()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-arcade-dark">Notificaciones</h1>
          <p className="text-sm text-arcade-dark/50">
            {total > 0
              ? `${total} en total${unreadCount > 0 ? ` · ${unreadCount} sin leer` : ""}`
              : "Cargando..."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="gap-1.5 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas leídas
          </Button>
        )}
      </div>

      {/* List */}
      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-arcade-dark/30" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-arcade-dark/40">
          <Bell className="mb-3 h-10 w-10" />
          <p className="text-sm">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className={cn(
                "flex w-full items-start gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-arcade-red/5",
                !n.read && "bg-arcade-red/5"
              )}
              onClick={() => handleClick(n)}
            >
              {getNotificationIcon(n.type)}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm text-arcade-dark",
                    !n.read && "font-semibold"
                  )}
                >
                  {n.title}
                </p>
                <p className="mt-0.5 text-sm text-arcade-dark/60 truncate">
                  {n.message}
                </p>
                <p className="mt-1 text-xs text-arcade-dark/40">
                  {timeAgo(n.created_at)}
                </p>
              </div>
              {!n.read && (
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Cargar más
          </Button>
        </div>
      )}
    </div>
  )
}
