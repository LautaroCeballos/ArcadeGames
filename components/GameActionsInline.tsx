"use client"

import { useActionState } from "react"
import { EyeOff, Eye, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleVisibility, deleteGame } from "@/lib/actions/games"

interface GameActionsInlineProps {
  gameId: string
  hidden: boolean
}

export function ToggleVisibilityButton({ gameId, hidden }: GameActionsInlineProps) {
  const [, formAction, pending] = useActionState(
    async () => await toggleVisibility(gameId),
    null,
  )

  return (
    <form action={formAction}>
      <Button type="submit" variant="ghost" size="icon" className="size-8" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      </Button>
    </form>
  )
}

export function DeleteGameButton({ gameId }: { gameId: string }) {
  const [, formAction, pending] = useActionState(
    async () => await deleteGame(gameId),
    null,
  )

  return (
    <form action={formAction}>
      <Button type="submit" variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </Button>
    </form>
  )
}
