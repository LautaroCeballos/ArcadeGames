"use client"

import { useActionState } from "react"
import { toggleVisibility, deleteGame } from "@/lib/actions/games"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"

interface GameActionsProps {
  gameId: string
  hidden: boolean
}

export function GameActions({ gameId, hidden }: GameActionsProps) {
  const router = useRouter()

  async function handleToggle() {
    const result = await toggleVisibility(gameId)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({ title: hidden ? "Juego visible" : "Juego oculto" })
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este juego? Esta acción no se puede deshacer.")) return
    const result = await deleteGame(gameId)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Juego eliminado" })
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <form action={handleToggle}>
        <Button variant="outline" size="sm" type="submit">
          {hidden ? "Mostrar" : "Ocultar"}
        </Button>
      </form>
      <form action={handleDelete}>
        <Button variant="destructive" size="sm" type="submit">
          Eliminar
        </Button>
      </form>
    </div>
  )
}
