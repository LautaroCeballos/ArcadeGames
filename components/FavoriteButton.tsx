"use client"

import { useActionState } from "react"
import { Heart, Loader2 } from "lucide-react"
import { toggleFavorite } from "@/lib/actions/favorites"
import { Button } from "@/components/ui/button"

interface FavoriteButtonProps {
  gameId: string
  isFavorited: boolean
  isAuthenticated: boolean
}

export function FavoriteButton({ gameId, isFavorited, isAuthenticated }: FavoriteButtonProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; favorited?: boolean } | null) => {
      return toggleFavorite(gameId)
    },
    { favorited: isFavorited }
  )

  const currentFavorited = state?.favorited ?? isFavorited

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="gap-1.5 opacity-50 cursor-not-allowed"
        title="Inicia sesión para marcar favoritos"
      >
        <Heart className="size-4" />
        <span className="text-xs">Favoritos</span>
      </Button>
    )
  }

  return (
    <form action={formAction}>
      <Button
        type="submit"
        variant={currentFavorited ? "default" : "outline"}
        size="sm"
        disabled={pending}
        className={`gap-1.5 transition-all ${
          currentFavorited
            ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
            : "text-muted-foreground hover:text-red-500 hover:border-red-300"
        }`}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Heart
            className={`size-4 transition-all ${
              currentFavorited ? "fill-current" : ""
            }`}
          />
        )}
        <span className="text-xs">
          {currentFavorited ? "Favorito" : "Favoritos"}
        </span>
      </Button>
      {state?.error && (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      )}
    </form>
  )
}
