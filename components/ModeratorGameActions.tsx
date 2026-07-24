"use client"

import { useRouter } from "next/navigation"
import { Check, X, Trash2 } from "lucide-react"
import { approveGame, rejectGame, modDeleteGame } from "@/lib/actions/games"
import type { GameWithDetails } from "@/lib/definitions"
import { Button } from "@/components/ui/button"

interface ModeratorGameActionsProps {
  game: GameWithDetails
}

export function ModeratorGameActions({ game }: ModeratorGameActionsProps) {
  const router = useRouter()

  const handleApprove = async () => {
    const result = await approveGame(game.id)
    if (result.success) router.refresh()
  }

  const handleReject = async () => {
    const result = await rejectGame(game.id)
    if (result.success) router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este juego? Esta acción no se puede deshacer.")) return
    const result = await modDeleteGame(game.id)
    if (result.success) router.refresh()
  }

  if (game.status === "pending") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={handleApprove}
          title="Aprobar"
        >
          <Check className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleReject}
          title="Rechazar"
        >
          <X className="size-3.5" />
        </Button>
      </>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      title="Eliminar"
    >
      <Trash2 className="size-3.5" />
    </Button>
  )
}
