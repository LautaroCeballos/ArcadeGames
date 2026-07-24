"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Shield, Check, X, Trash2, Eye, EyeOff, AlertTriangle, RotateCcw } from "lucide-react"
import { approveGame, rejectGame, modDeleteGame, modToggleVisibility, revertToPending, getPendingGames, getModeratedGames } from "@/lib/actions/games"
import type { GameWithDetails } from "@/lib/definitions"

type Tab = "pending" | "approved" | "rejected" | "all"

export function ModeratorDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("pending")
  const [games, setGames] = useState<GameWithDetails[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ gameId: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const fetchGames = useCallback(async (currentTab: Tab) => {
    setLoading(true)
    setError(null)
    try {
      let result
      if (currentTab === "pending") {
        result = await getPendingGames()
      } else {
        const status = currentTab === "all" ? undefined : currentTab
        result = await getModeratedGames({ status })
      }
      setGames(result.games)
      setTotal(result.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar juegos")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchGames("pending")
  }, [fetchGames])

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    fetchGames(newTab)
  }

  const handleApprove = async (gameId: string) => {
    const result = await approveGame(gameId)
    if (result.error) {
      setError(result.error)
    } else {
      fetchGames(tab)
    }
  }

  const openRejectDialog = (gameId: string, title: string) => {
    setRejectReason("")
    setRejectDialog({ gameId, title })
  }

  const confirmReject = async () => {
    if (!rejectDialog) return
    const result = await rejectGame(rejectDialog.gameId, rejectReason)
    setRejectDialog(null)
    setRejectReason("")
    if (result.error) {
      setError(result.error)
    } else {
      fetchGames(tab)
    }
  }

  const handleRevertToPending = async (gameId: string) => {
    const result = await revertToPending(gameId)
    if (result.error) {
      setError(result.error)
    } else {
      fetchGames(tab)
    }
  }

  const handleDelete = async (gameId: string) => {
    if (!confirm("¿Estás seguro de eliminar este juego? Esta acción no se puede deshacer.")) return
    const result = await modDeleteGame(gameId)
    if (result.error) {
      setError(result.error)
    } else {
      fetchGames(tab)
    }
  }

  const handleToggleVisibility = async (gameId: string) => {
    const result = await modToggleVisibility(gameId)
    if (result.error) {
      setError(result.error)
    } else {
      fetchGames(tab)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "pending", label: "Pendientes" },
    { id: "approved", label: "Aprobados" },
    { id: "rejected", label: "Rechazados" },
    { id: "all", label: "Todos" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-arcade-red" />
        <div>
          <h1 className="text-2xl font-bold">Panel de Moderación</h1>
          <p className="text-sm text-muted-foreground">
            {total} juego{total !== 1 ? "s" : ""} en esta categoría
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-arcade-red text-arcade-red"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && games.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Shield className="h-12 w-12" />
          <p className="text-lg font-medium">No hay juegos aquí</p>
          <p className="text-sm">
            {tab === "pending"
              ? "No hay juegos pendientes de moderación."
              : "No hay juegos en esta categoría."}
          </p>
        </div>
      )}

      {/* Game grid */}
      {!loading && games.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <ModeratorGameCard
              key={game.id}
              game={game}
              onApprove={handleApprove}
              onReject={openRejectDialog}
              onRevertToPending={handleRevertToPending}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}

      {/* Reject dialog */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Rechazar juego</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              ¿Estás seguro de rechazar <span className="font-medium">{rejectDialog.title}</span>?
            </p>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              Motivo del rechazo (visible para el desarrollador)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: El juego no cumple con las normas de contenido..."
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-arcade-red focus:ring-1 focus:ring-arcade-red"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectDialog(null)}
                className="rounded-md border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Rechazar juego
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModeratorGameCard({
  game,
  onApprove,
  onReject,
  onRevertToPending,
  onDelete,
  onToggleVisibility,
}: {
  game: GameWithDetails
  onApprove: (id: string) => void
  onReject: (id: string, title: string) => void
  onRevertToPending: (id: string) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string) => void
}) {
  const statusBadge = () => {
    switch (game.status) {
      case "approved":
        return game.hidden
          ? { label: "Oculto", className: "bg-gray-200 text-gray-700" }
          : { label: "Publicado", className: "bg-green-100 text-green-700" }
      case "pending":
        return { label: "Pendiente", className: "bg-amber-100 text-amber-700" }
      case "rejected":
        return { label: "Rechazado", className: "bg-red-100 text-red-700" }
      default:
        return { label: game.status, className: "" }
    }
  }

  const badge = statusBadge()

  return (
    <div className="group rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <Link href={`/juego/${game.id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
          {game.thumbnail_url ? (
            <Image
              src={game.thumbnail_url}
              alt={game.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
              🎮
            </div>
          )}
          {/* Status badge overlay */}
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={`/juego/${game.id}`} className="hover:underline">
          <h3 className="font-semibold leading-tight">{game.title}</h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          por{" "}
          {game.profiles?.username ? (
            <Link
              href={`/perfil/${game.profiles.username}`}
              className="hover:text-arcade-red hover:underline"
            >
              {game.profiles.username}
            </Link>
          ) : (
            "usuario desconocido"
          )}
        </p>

        {/* Tags */}
        {game.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {game.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Rejection reason */}
        {game.status === "rejected" && game.rejection_reason && (
          <div className="mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
            <span className="font-medium">Motivo:</span> {game.rejection_reason}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {game.status === "pending" && (
            <>
              <button
                onClick={() => onApprove(game.id)}
                className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-200"
              >
                <Check className="h-3.5 w-3.5" />
                Aprobar
              </button>
              <button
                onClick={() => onReject(game.id, game.title)}
                className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
              >
                <X className="h-3.5 w-3.5" />
                Rechazar
              </button>
            </>
          )}
          {game.status === "approved" && (
            <>
              <button
                onClick={() => onRevertToPending(game.id)}
                className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200"
                title="Volver a pendiente"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Volver a pendiente
              </button>
              <button
                onClick={() => onToggleVisibility(game.id)}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                title={game.hidden ? "Mostrar" : "Ocultar"}
              >
                {game.hidden ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {game.hidden ? "Mostrar" : "Ocultar"}
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(game.id)}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
