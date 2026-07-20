"use client"

import { useActionState, useState, useMemo, useId, useCallback } from "react"
import { createGame } from "@/lib/actions/games"
import { extractGameId, buildEmbedUrl, isValidMakeCodeUrl, extractScratchId, buildScratchEmbedUrl, isValidScratchUrl } from "@/lib/game-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArcadeEmbed } from "@/components/ArcadeEmbed"
import { ScratchEmbed } from "@/components/ScratchEmbed"
import { ThumbnailPicker } from "@/components/ThumbnailPicker"
import { Gamepad2, Puzzle } from "lucide-react"

interface SubmitGameFormProps {
  categories: { id: string; name: string }[]
}

type Platform = 'makecode' | 'scratch'

export function SubmitGameForm({ categories }: SubmitGameFormProps) {
  const [state, formAction, pending] = useActionState(createGame, { error: "" })
  const [platform, setPlatform] = useState<Platform>('makecode')
  const [urlValue, setUrlValue] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const uid = useId()

  // ── Derive embed URL, game ID, and error based on platform ──
  const { previewEmbedUrl, shortId, urlError } = useMemo(() => {
    if (!urlValue) return { previewEmbedUrl: null, shortId: null, urlError: null }

    if (platform === 'makecode') {
      if (!isValidMakeCodeUrl(urlValue)) {
        return { previewEmbedUrl: null, shortId: null, urlError: "La URL no tiene un formato válido de MakeCode Arcade" }
      }
      const id = extractGameId(urlValue)
      return {
        previewEmbedUrl: id ? buildEmbedUrl(id) : null,
        shortId: id,
        urlError: null,
      }
    } else {
      if (!isValidScratchUrl(urlValue)) {
        return { previewEmbedUrl: null, shortId: null, urlError: "La URL no tiene un formato válido de Scratch" }
      }
      const id = extractScratchId(urlValue)
      return {
        previewEmbedUrl: id ? buildScratchEmbedUrl(id) : null,
        shortId: id,
        urlError: null,
      }
    }
  }, [urlValue, platform])

  const urlHintId = `${uid}-url-hint`
  const urlErrorId = `${uid}-url-error`
  const formErrorId = `${uid}-form-error`

  const handlePlatformChange = useCallback((newPlatform: Platform) => {
    setPlatform(newPlatform)
    setUrlValue("")
    setThumbnailUrl(null)
  }, [])

  const handleSubmit = useCallback(
    (formData: FormData) => {
      if (thumbnailUrl) {
        formData.append("thumbnail_url", thumbnailUrl)
      }
      formData.set("platform", platform)
      formAction(formData)
    },
    [thumbnailUrl, platform, formAction]
  )

  const embedDescriptionId = `${uid}-embed`

  return (
    <form action={handleSubmit} className="space-y-6" aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`} className="sr-only">Formulario para publicar un juego</h2>

      {/* ── Platform toggle ── */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="text-base font-semibold mb-3">Plataforma</legend>
        <div className="flex rounded-lg border border-border bg-muted/30 p-1" role="radiogroup" aria-label="Seleccionar plataforma">
          <button
            type="button"
            role="radio"
            aria-checked={platform === 'makecode'}
            onClick={() => handlePlatformChange('makecode')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
              platform === 'makecode'
                ? 'bg-arcade-red text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Gamepad2 className="size-4" aria-hidden="true" />
            MakeCode Arcade
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={platform === 'scratch'}
            onClick={() => handlePlatformChange('scratch')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
              platform === 'scratch'
                ? 'bg-arcade-green text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Puzzle className="size-4" aria-hidden="true" />
            Scratch
          </button>
        </div>
      </fieldset>

      {/* ── URL input ── */}
      <fieldset className="space-y-4 border-0 p-0 m-0">
        <legend className="text-base font-semibold mb-2">Link del juego</legend>

        <div className="space-y-2">
          <Label htmlFor="url">
            {platform === 'makecode' ? 'URL de MakeCode Arcade' : 'URL del proyecto de Scratch'}
            <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder={platform === 'makecode'
              ? "https://arcade.makecode.com/---run?id=..."
              : "https://scratch.mit.edu/projects/617923907"
            }
            required
            aria-required="true"
            aria-describedby={urlHintId}
            aria-invalid={!!urlError || undefined}
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
          {platform === 'makecode' ? (
            <p id={urlHintId} className="text-xs text-muted-foreground">
              Formatos aceptados:
              <code className="block mt-0.5 text-[11px]">https://arcade.makecode.com/---run?id=_HdY0sobLD4zd</code>
              <code className="block text-[11px]">https://makecode.com/_ViYEarFuVgC8</code>
              <code className="block text-[11px]">https://arcade.makecode.com/66795-36651-40272-92516</code>
            </p>
          ) : (
            <p id={urlHintId} className="text-xs text-muted-foreground">
              Pegá la URL de tu proyecto de Scratch
              <code className="block mt-0.5 text-[11px]">https://scratch.mit.edu/projects/617923907</code>
            </p>
          )}
          {urlError && (
            <p id={urlErrorId} role="alert" className="text-xs text-destructive">
              {urlError}
            </p>
          )}
        </div>

        {/* ── Embed preview ── */}
        {previewEmbedUrl && !urlError && (
          <div className="space-y-2">
            <Label id={embedDescriptionId}>Vista previa</Label>
            {platform === 'makecode' ? (
              <ArcadeEmbed url={previewEmbedUrl} title="Vista previa del juego" />
            ) : (
              <ScratchEmbed url={previewEmbedUrl} title="Vista previa del juego" />
            )}
          </div>
        )}
      </fieldset>

      {/* ── Thumbnail picker ── */}
      {shortId && !urlError && (
        <fieldset className="space-y-4 border-0 p-0 m-0">
          <legend className="text-base font-semibold mb-2">Miniatura</legend>
          <ThumbnailPicker
            shortId={shortId}
            embedUrl={previewEmbedUrl}
            onThumbnailChange={setThumbnailUrl}
            platform={platform}
          />
        </fieldset>
      )}

      {/* ── Shared info fields ── */}
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

      {/* ── Server error ── */}
      {state.error && (
        <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3">
          <p id={formErrorId} className="text-sm text-destructive font-medium">
            {state.error}
          </p>
        </div>
      )}

      {/* ── Submit ── */}
      <Button type="submit" disabled={pending}>
        {pending ? "Publicando..." : "Publicar juego"}
      </Button>
    </form>
  )
}
