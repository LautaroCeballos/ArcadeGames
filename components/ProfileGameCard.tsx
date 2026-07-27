"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Play, Pencil, Star, Send, Loader2, MoreVertical, Eye, EyeOff, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ToggleVisibilityButton, DeleteGameButton } from "@/components/GameActionsInline"
import { ModeratorGameActions } from "@/components/ModeratorGameActions"
import { publishGame, toggleVisibility, deleteGame } from "@/lib/actions/games"
import type { GameWithDetails } from "@/lib/definitions"

interface ProfileGameCardProps {
  game: GameWithDetails
  isOwner: boolean
  isModOrAdmin?: boolean
  showAuthor?: boolean
  hideBadge?: boolean
}

const statusConfig: Record<string, { label: string; class: string }> = {
  approved: { label: "Publicado", class: "bg-arcade-green text-white" },
  pending: { label: "En moderación", class: "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950" },
  rejected: { label: "Rechazado", class: "bg-destructive text-destructive-foreground" },
  draft: { label: "Borrador", class: "border-gray-300 text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400" },
}

function getStatusBadge(game: GameWithDetails) {
  if (game.hidden) return { label: "Oculto", class: "bg-muted text-muted-foreground" }
  return statusConfig[game.status] ?? { label: game.status, class: "bg-muted text-muted-foreground" }
}

function formatRelativeDate(dateStr: string) {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Hoy"
  if (days === 1) return "Ayer"
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`
  return `Hace ${Math.floor(days / 365)} años`
}

export function ProfileGameCard({ game, isOwner, isModOrAdmin = false, showAuthor = false, hideBadge = false }: ProfileGameCardProps) {
  const router = useRouter()
  const [publishing, setPublishing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = getStatusBadge(game)

  async function handlePublish() {
    setPublishing(true)
    const result = await publishGame(game.id)
    setPublishing(false)
    if (!result.error) {
      router.refresh()
    }
  }

  return (
    <div className="flex gap-4 rounded-xl border bg-card p-3 sm:p-4">
      <Link
        href={`/juego/${game.id}`}
        className="relative shrink-0 size-20 sm:size-24 rounded-lg overflow-hidden bg-muted group"
      >
        {game.thumbnail_url ? (
          <img src={game.thumbnail_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-arcade-green/20 to-arcade-red/20 flex items-center justify-center">
            <Play className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Play className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-3">
        {/* Col 1, row 1: title + badge */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/juego/${game.id}`} className="hover:underline min-w-0">
            <h3 className="font-semibold truncate">{game.title}</h3>
          </Link>
          {!hideBadge && (
            <Badge variant="outline" className={`text-xs font-normal shrink-0 ${badge.class}`}>
              {badge.label}
            </Badge>
          )}
        </div>

        {/* Col 1, row 2: action buttons — desktop */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <Button asChild variant="ghost" size="icon" className="size-6 sm:size-8">
            <Link href={`/juego/${game.id}`}><Play className="size-3 sm:size-3.5" /></Link>
          </Button>
          {isOwner && (
            <>
              {game.status === "draft" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 sm:size-8 text-arcade-green hover:text-arcade-green hover:bg-arcade-green/10"
                  onClick={handlePublish}
                  disabled={publishing}
                  title="Publicar juego"
                >
                  {publishing ? <Loader2 className="size-3 sm:size-3.5 animate-spin" /> : <Send className="size-3 sm:size-3.5" />}
                </Button>
              )}
              <Button asChild variant="ghost" size="icon" className="size-6 sm:size-8">
                <Link href={`/editar/${game.id}`}><Pencil className="size-3 sm:size-3.5" /></Link>
              </Button>
              <ToggleVisibilityButton gameId={game.id} hidden={game.hidden} />
              <DeleteGameButton gameId={game.id} />
            </>
          )}
          {!isOwner && isModOrAdmin && (
            <ModeratorGameActions game={game} />
          )}
        </div>

        {/* Col 1, row 2: action buttons — mobile kebab menu */}
        <div className="relative sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Acciones"
          >
            <MoreVertical className="size-3" />
          </Button>
          {menuOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border bg-card shadow-lg">
              <Link
                href={`/juego/${game.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Play className="size-3.5" />
                Jugar
              </Link>
              {isOwner && (
                <>
                  {game.status === "draft" && (
                    <button
                      onClick={() => { handlePublish(); setMenuOpen(false) }}
                      disabled={publishing}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-arcade-green transition-colors hover:bg-muted"
                    >
                      {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                      Publicar
                    </button>
                  )}
                  <Link
                    href={`/editar/${game.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Link>
                  <button
                    onClick={async () => {
                      await toggleVisibility(game.id)
                      setMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    {game.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    {game.hidden ? "Mostrar" : "Ocultar"}
                  </button>
                  <button
                    onClick={async () => {
                      await deleteGame(game.id)
                      setMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" />
                    Eliminar
                  </button>
                </>
              )}
              {!isOwner && isModOrAdmin && (
                <ModeratorGameActions game={game} />
              )}
            </div>
          )}
        </div>

        {/* Col 2, row 1+2: description + metadata */}
        <div className="space-y-1 row-span-2">
          {game.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{game.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {showAuthor && game.profiles?.username && (
              <span>
                por{" "}
                <Link
                  href={`/perfil/${game.profiles.username}`}
                  className="font-medium hover:text-arcade-red transition-colors"
                >
                  {game.profiles.username}
                </Link>
              </span>
            )}
            <span>{game.views} vistas</span>
            {(game.stars_count ?? 0) > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                {game.stars_count}
              </span>
            )}
            <span>{formatRelativeDate(game.created_at)}</span>
          </div>
          {game.status === "rejected" && game.rejection_reason && (
            <p className="text-xs text-red-600 mt-1">
              <span className="font-medium">Motivo del rechazo:</span> {game.rejection_reason}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
