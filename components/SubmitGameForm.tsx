"use client"

import { useActionState, useState, useMemo } from "react"
import { createGame } from "@/lib/actions/games"
import { extractGameId, buildEmbedUrl } from "@/lib/game-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArcadeEmbed } from "@/components/ArcadeEmbed"

interface SubmitGameFormProps {
  categories: { id: string; name: string }[]
}

export function SubmitGameForm({ categories }: SubmitGameFormProps) {
  const [state, formAction, pending] = useActionState(createGame, { error: "" })
  const [urlValue, setUrlValue] = useState("")

  const previewEmbedUrl = useMemo(() => {
    const id = extractGameId(urlValue)
    return id ? buildEmbedUrl(id) : null
  }, [urlValue])

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">URL del juego (MakeCode Arcade)</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://arcade.makecode.com/---run?id=..."
          required
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Pegá la URL de MakeCode Arcade. Ej: https://arcade.makecode.com/---run?id=_HdY0sobLD4zd
        </p>
      </div>

      {previewEmbedUrl && (
        <div className="space-y-2">
          <Label>Vista previa</Label>
          <ArcadeEmbed url={previewEmbedUrl} title="Vista previa" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Categoría</Label>
        <Select name="category_id">
          <SelectTrigger>
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

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Publicando..." : "Publicar juego"}
      </Button>
    </form>
  )
}
