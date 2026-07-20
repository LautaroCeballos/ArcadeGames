"use client"

import { useActionState, useState, useId, useCallback } from "react"
import { updateGame } from "@/lib/actions/games"
import { extractGameId, extractScratchId } from "@/lib/game-utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArcadeEmbed } from "@/components/ArcadeEmbed"
import { ScratchEmbed } from "@/components/ScratchEmbed"
import { ThumbnailPicker } from "@/components/ThumbnailPicker"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface EditGameFormProps {
  game: {
    id: string
    title: string
    description: string
    category_id: string
    thumbnail_url: string
    embed_url: string
    platform?: 'makecode' | 'scratch'
  }
  categories: { id: string; name: string }[]
  username: string
}

export function EditGameForm({ game, categories, username }: EditGameFormProps) {
  const [state, formAction, pending] = useActionState(updateGame, null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(game.thumbnail_url || null)
  const router = useRouter()
  const uid = useId()
  const isScratch = game.platform === 'scratch'
  const shortId = isScratch ? extractScratchId(game.embed_url) : extractGameId(game.embed_url)

  const profileUrl = `/perfil/${username}`

  const handleSubmit = useCallback(
    (formData: FormData) => {
      formData.append("id", game.id)
      if (thumbnailUrl) {
        formData.append("thumbnail_url", thumbnailUrl)
      }
      formAction(formData)
    },
    [game.id, thumbnailUrl, formAction]
  )

  // Redirect on success
  if (state?.success) {
    router.push(profileUrl)
  }

  return (
    <form action={handleSubmit} className="space-y-6" aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`} className="sr-only">
        Formulario para editar juego
      </h2>

      {/* Back link */}
      <Link
        href={profileUrl}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Volver al perfil
      </Link>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Vista previa</Label>
        {isScratch ? (
          <ScratchEmbed url={game.embed_url} title={game.title} />
        ) : (
          <ArcadeEmbed url={game.embed_url} title={game.title} />
        )}
      </div>

      {/* Thumbnail */}
      {shortId && (
        <fieldset className="space-y-4 border-0 p-0 m-0">
          <legend className="text-base font-semibold">Miniatura</legend>
          <ThumbnailPicker
            shortId={shortId}
            embedUrl={game.embed_url}
            onThumbnailChange={setThumbnailUrl}
            platform={game.platform ?? 'makecode'}
          />
        </fieldset>
      )}

      {/* Info */}
      <fieldset className="space-y-4 border-0 p-0 m-0">
        <legend className="text-base font-semibold">Información del juego</legend>

        <div className="space-y-2">
          <Label htmlFor="title">
            Título <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={game.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            name="description"
            defaultValue={game.description}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Categoría</Label>
          <Select name="category_id" defaultValue={game.category_id || undefined}>
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </fieldset>

      {state?.error && (
        <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3">
          <p className="text-sm text-destructive font-medium">{state.error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={profileUrl}>Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
