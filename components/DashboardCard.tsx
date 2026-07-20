"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Pencil, Trash2, Play, Star, Clock, Loader2 } from "lucide-react"
import { toggleVisibility, deleteGame } from "@/lib/actions/games"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import type { GameWithDetails } from "@/lib/definitions"

interface DashboardCardProps {
  game: GameWithDetails
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `hace ${days} día${days > 1 ? "s" : ""}`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? "es" : ""}`
}

function getStatusInfo(status: string, hidden: boolean) {
  if (status === "pending") {
    return {
      label: "En moderación",
      variant: "outline" as const,
      className:
        "border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    }
  }
  if (status === "rejected") {
    return {
      label: "Rechazado",
      variant: "destructive" as const,
      className: "",
    }
  }
  // approved
  if (hidden) {
    return {
      label: "Oculto",
      variant: "secondary" as const,
      className: "text-muted-foreground",
    }
  }
  return {
    label: "Publicado",
    variant: "default" as const,
    className: "bg-arcade-green text-white hover:bg-arcade-green/90",
  }
}

export function DashboardCard({ game }: DashboardCardProps) {
  const router = useRouter()
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const status = getStatusInfo(game.status, game.hidden)

  async function handleToggle() {
    setToggling(true)
    const result = await toggleVisibility(game.id)
    setToggling(false)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({ title: game.hidden ? "Juego visible públicamente" : "Juego oculto" })
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este juego? Esta acción no se puede deshacer.")) return
    setDeleting(true)
    const result = await deleteGame(game.id)
    setDeleting(false)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Juego eliminado" })
      router.refresh()
    }
  }

  const thumbnailSrc = game.thumbnail_url

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md sm:flex-row">
      {/* Thumbnail / placeholder */}
      <Link
        href={`/juego/${game.id}`}
        className="relative aspect-video w-full overflow-hidden bg-muted sm:aspect-auto sm:w-44 sm:shrink-0"
      >
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={game.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-arcade-green/20 to-arcade-dark/10 text-5xl text-muted-foreground/20">
            🎮
          </div>
        )}
        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <Play className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Top row: title + status */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/juego/${game.id}`}
            className="font-semibold text-foreground hover:text-arcade-red transition-colors line-clamp-1"
          >
            {game.title}
          </Link>
          <Badge className={`shrink-0 ${status.className}`} variant={status.variant}>
            {status.label}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {game.categories && (
            <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
              {game.categories.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {game.views} vista{game.views !== 1 ? "s" : ""}
          </span>
          {game.avg_rating !== null && (
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {game.avg_rating}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {timeAgo(game.created_at)}
          </span>
        </div>

        {/* Description */}
        {game.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed">
            {game.description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs">
            <Link href={`/juego/${game.id}`}>
              <Play className="size-3.5" />
              Jugar
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs">
            <Link href={`/editar/${game.id}`}>
              <Pencil className="size-3.5" />
              Editar
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={toggling}
            className="gap-1.5 text-xs"
          >
            {toggling ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : game.hidden ? (
              <Eye className="size-3.5" />
            ) : (
              <EyeOff className="size-3.5" />
            )}
            {game.hidden ? "Mostrar" : "Ocultar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}
