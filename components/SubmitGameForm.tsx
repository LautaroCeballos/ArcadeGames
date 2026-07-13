"use client"

import { useActionState, useState, useMemo, useId } from "react"
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
  const uid = useId()

  const previewEmbedUrl = useMemo(() => {
    const id = extractGameId(urlValue)
    return id ? buildEmbedUrl(id) : null
  }, [urlValue])

  const urlHintId = `${uid}-url-hint`
  const urlErrorId = `${uid}-url-error`
  const formErrorId = `${uid}-form-error`

  const urlError = urlValue && !isValidMakeCodeUrl(urlValue) ? "La URL no tiene un formato válido" : null

  return (
    <form action={formAction} className="space-y-6" aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`} className="sr-only">Formulario para publicar un juego</h2>

      <fieldset className="space-y-4 border-0 p-0 m-0">
        <legend className="text-base font-semibold mb-2">Link del juego</legend>

        <div className="space-y-2">
          <Label htmlFor="url">
            URL de MakeCode Arcade
            <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://arcade.makecode.com/---run?id=..."
            required
            aria-required="true"
            aria-describedby={urlHintId}
            aria-invalid={!!urlError || undefined}
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
          <p id={urlHintId} className="text-xs text-muted-foreground">
            Formats aceptados:
            <code className="block mt-0.5 text-[11px]">https://arcade.makecode.com/---run?id=_HdY0sobLD4zd</code>
            <code className="block text-[11px]">https://makecode.com/_ViYEarFuVgC8</code>
            <code className="block text-[11px]">https://arcade.makecode.com/66795-36651-40272-92516</code>
          </p>
          {urlError && (
            <p id={urlErrorId} role="alert" className="text-xs text-destructive">
              {urlError}
            </p>
          )}
        </div>

        {previewEmbedUrl && !urlError && (
          <div className="space-y-2">
            <Label>Vista previa</Label>
            <ArcadeEmbed url={previewEmbedUrl} title="Vista previa del juego" />
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4 border-0 p-0 m-0">
        <legend className="text-base font-semibold mb-2">Información del juego</legend>

        <div className="space-y-2">
          <Label htmlFor="title">
            Título
            <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
          </Label>
          <Input id="title" name="title" required aria-required="true" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Input id="description" name="description" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Categoría</Label>
          <Select name="category_id">
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

      {state.error && (
        <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3">
          <p id={formErrorId} className="text-sm text-destructive font-medium">
            {state.error}
          </p>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Publicando..." : "Publicar juego"}
      </Button>
    </form>
  )
}

function isValidMakeCodeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const { hostname, pathname, search } = parsed

    if (hostname === "arcade.makecode.com") {
      if (/[?&]id=[a-zA-Z0-9\-_]+/.test(search)) return true
      const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean)
      if (segments.length === 1 && !segments[0].startsWith("---")) return true
    }

    if (hostname === "makecode.com") {
      const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean)
      if (segments.length === 1) return true
    }
  } catch {
    return false
  }
  return false
}
