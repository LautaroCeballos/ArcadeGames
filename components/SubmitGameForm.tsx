"use client"

import { useActionState, useState, useMemo, useId, useCallback } from "react"
import { createGame } from "@/lib/actions/games"
import { extractGameId, buildEmbedUrl, isValidMakeCodeUrl, extractScratchId, buildScratchEmbedUrl, isValidScratchUrl } from "@/lib/game-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArcadeEmbed } from "@/components/ArcadeEmbed"
import { ScratchEmbed } from "@/components/ScratchEmbed"
import { ThumbnailPicker } from "@/components/ThumbnailPicker"
import { TagPicker } from "@/components/TagPicker"
import { Gamepad2, Puzzle, ArrowLeft, Sparkles } from "lucide-react"
import type { Tag } from "@/lib/definitions"

interface SubmitGameFormProps {
  tags: Tag[]
}

type Platform = 'makecode' | 'scratch'

/* ── Step 1: Platform selector ─────────────────────────────── */
function PlatformSelector({
  onSelect,
}: {
  onSelect: (platform: Platform) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-arcade-dark">¿Qué tipo de juego querés publicar?</h1>
        <p className="text-sm text-muted-foreground">Elegí la plataforma para empezar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-lg mx-auto">
        {/* MakeCode Arcade */}
        <button
          type="button"
          onClick={() => onSelect('makecode')}
          className="group relative flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-8 text-center transition-all duration-200 hover:border-arcade-red hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-red focus-visible:ring-offset-2"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-arcade-red/10 text-arcade-red transition-colors group-hover:bg-arcade-red group-hover:text-white">
            <Gamepad2 className="size-8" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-arcade-dark">MakeCode Arcade</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Juegos retro estilo Game Boy, creados con bloques o JavaScript
            </p>
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-arcade-red opacity-0 transition-opacity group-hover:opacity-100">
            <Sparkles className="size-3.5" />
            Elegir MakeCode
          </span>
        </button>

        {/* Scratch */}
        <button
          type="button"
          onClick={() => onSelect('scratch')}
          className="group relative flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-8 text-center transition-all duration-200 hover:border-arcade-green hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcade-green focus-visible:ring-offset-2"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-arcade-green/10 text-arcade-green transition-colors group-hover:bg-arcade-green group-hover:text-white">
            <Puzzle className="size-8" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-arcade-dark">Scratch</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Proyectos animados y juegos interactivos hechos con bloques
            </p>
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-arcade-green opacity-0 transition-opacity group-hover:opacity-100">
            <Sparkles className="size-3.5" />
            Elegir Scratch
          </span>
        </button>
      </div>
    </div>
  )
}

/* ── Step 2: Form ──────────────────────────────────────────── */
function GameForm({
  platform,
  tags,
  onBack,
}: {
  platform: Platform
  tags: Tag[]
  onBack: () => void
}) {
  const [state, formAction, pending] = useActionState(createGame, { error: "" })
  const [urlValue, setUrlValue] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const uid = useId()

  // Find platform tag
  const platformTag = useMemo(
    () => tags.find((t) =>
      platform === 'makecode' ? t.name === 'MakeCode Arcade' : t.name === 'Scratch'
    ),
    [tags, platform]
  )

  // Filter out the opposite platform tag so it doesn't appear as an option
  const availableTags = useMemo(
    () => tags.filter((t) =>
      platform === 'makecode' ? t.name !== 'Scratch' : t.name !== 'MakeCode Arcade'
    ),
    [tags, platform]
  )

  // Derive embed URL, game ID, and error based on platform
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

  const urlErrorId = `${uid}-url-error`
  const formErrorId = `${uid}-form-error`

  const handleSubmit = useCallback(
    (formData: FormData) => {
      if (thumbnailUrl) {
        formData.append("thumbnail_url", thumbnailUrl)
      }
      formData.set("platform", platform)
      // Include platform tag + user-selected tags
      const allTagIds = platformTag
        ? [platformTag.id, ...selectedTagIds.filter((id) => id !== platformTag.id)]
        : selectedTagIds
      formData.set("tag_ids", JSON.stringify(allTagIds))
      formAction(formData)
    },
    [thumbnailUrl, platform, platformTag, selectedTagIds, formAction]
  )

  const embedDescriptionId = `${uid}-embed`

  return (
    <form action={handleSubmit} className="space-y-6" aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`} className="sr-only">
        Formulario para publicar un juego de {platform === 'makecode' ? 'MakeCode Arcade' : 'Scratch'}
      </h2>

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Cambiar plataforma
      </button>

      {/* 2-column layout */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12">
        {/* ── LEFT COLUMN: Preview (sticky on desktop) ── */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <Label className="text-base font-semibold">Vista previa</Label>

          {previewEmbedUrl && !urlError ? (
            platform === 'makecode' ? (
              <ArcadeEmbed url={previewEmbedUrl} title="Vista previa del juego" />
            ) : (
              <ScratchEmbed url={previewEmbedUrl} title="Vista previa del juego" />
            )
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-[10px] border-2 border-dashed border-border bg-muted/30">
              <div className="text-center px-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {urlError ? "URL inválida" : "Pegá la URL del juego"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {platform === 'makecode'
                    ? "https://arcade.makecode.com/---run?id=..."
                    : "https://scratch.mit.edu/projects/..."
                  }
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN: Inputs ── */}
        <div className="mt-6 lg:mt-0 space-y-6">
          {/* URL input */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
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
              aria-invalid={!!urlError || undefined}
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              autoFocus
            />
            {urlError && (
              <div className="space-y-2">
                <p id={urlErrorId} role="alert" className="text-xs text-destructive font-medium">
                  {urlError}
                </p>
                <div className="relative">
                  <div className="absolute -top-1.5 left-4 size-3 rotate-45 border-l border-t border-border bg-card" />
                  <div className="rounded-lg border bg-card p-3 shadow-sm text-xs space-y-1.5">
                    <p className="font-semibold text-foreground">Formatos aceptados:</p>
                    {platform === 'makecode' ? (
                      <>
                        <code className="block text-[11px] text-muted-foreground">https://arcade.makecode.com/---run?id=_HdY0sobLD4zd</code>
                        <code className="block text-[11px] text-muted-foreground">https://makecode.com/_ViYEarFuVgC8</code>
                        <code className="block text-[11px] text-muted-foreground">https://arcade.makecode.com/66795-36651-40272-92516</code>
                      </>
                    ) : (
                      <code className="block text-[11px] text-muted-foreground">https://scratch.mit.edu/projects/617923907</code>
                    )}
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título
              <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
            </Label>
            <Input id="title" name="title" required aria-required="true" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" />
          </div>

          {/* TagPicker: content tags + platform tag locked */}
          <fieldset className="space-y-3 border-0 p-0 m-0">
            <legend className="text-sm font-medium">Etiquetas</legend>
            <p className="text-xs text-muted-foreground">
              Elegí las etiquetas que describan tu juego
            </p>
            <TagPicker
              tags={availableTags}
              selectedIds={[
                ...(platformTag ? [platformTag.id] : []),
                ...selectedTagIds,
              ]}
              onChange={(ids) => {
                // Keep platform tag always selected
                const withoutPlatform = platformTag
                  ? ids.filter((id) => id !== platformTag.id)
                  : ids
                setSelectedTagIds(withoutPlatform)
              }}
              lockedIds={platformTag ? [platformTag.id] : []}
              max={5}
            />
          </fieldset>

          {/* Thumbnail */}
          {shortId && !urlError && (
            <fieldset className="space-y-4 border-0 p-0 m-0">
              <legend className="text-sm font-medium">Miniatura</legend>
              <ThumbnailPicker
                shortId={shortId}
                embedUrl={previewEmbedUrl}
                onThumbnailChange={setThumbnailUrl}
                platform={platform}
              />
            </fieldset>
          )}

          {/* Server error */}
          {state.error && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3">
              <p id={formErrorId} className="text-sm text-destructive font-medium">
                {state.error}
              </p>
            </div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
            {pending ? "Publicando..." : `Publicar en ${platform === 'makecode' ? 'MakeCode Arcade' : 'Scratch'}`}
          </Button>
        </div>
      </div>
    </form>
  )
}

/* ── Main: Step 1 → Step 2 ─────────────────────────────────── */
export function SubmitGameForm({ tags }: SubmitGameFormProps) {
  const [platform, setPlatform] = useState<Platform | null>(null)

  if (!platform) {
    return <PlatformSelector onSelect={setPlatform} />
  }

  return (
    <GameForm
      key={platform}
      platform={platform}
      tags={tags}
      onBack={() => setPlatform(null)}
    />
  )
}
