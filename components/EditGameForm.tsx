"use client"

import { useActionState, useState, useId, useMemo, useCallback, useEffect } from "react"
import { updateGame } from "@/lib/actions/games"
import { extractGameId, extractScratchId } from "@/lib/game-utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArcadeEmbed } from "@/components/ArcadeEmbed"
import { ScratchEmbed } from "@/components/ScratchEmbed"
import { ThumbnailPicker } from "@/components/ThumbnailPicker"
import { TagPicker } from "@/components/TagPicker"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Tag } from "@/lib/definitions"

interface EditGameFormProps {
  game: {
    id: string
    title: string
    description: string
    thumbnail_url: string
    embed_url: string
    platform?: 'makecode' | 'scratch'
    tagIds: string[]
  }
  tags: Tag[]
  username: string
}

export function EditGameForm({ game, tags, username }: EditGameFormProps) {
  const [state, formAction, pending] = useActionState(updateGame, null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(game.thumbnail_url || null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    game.tagIds.filter((id) => {
      const tag = tags.find((t) => t.id === id)
      return tag && tag.name !== 'MakeCode Arcade' && tag.name !== 'Scratch'
    })
  )
  const router = useRouter()
  const uid = useId()
  const isScratch = game.platform === 'scratch'
  const shortId = isScratch ? extractScratchId(game.embed_url) : extractGameId(game.embed_url)

  // Find platform tag
  const platformTag = useMemo(
    () => tags.find((t) =>
      game.platform === 'scratch' ? t.name === 'Scratch' : t.name === 'MakeCode Arcade'
    ),
    [tags, game.platform]
  )

  // Filter out the opposite platform tag so it doesn't appear as an option
  const availableTags = useMemo(
    () => tags.filter((t) =>
      game.platform === 'scratch' ? t.name !== 'MakeCode Arcade' : t.name !== 'Scratch'
    ),
    [tags, game.platform]
  )

  const profileUrl = `/perfil/${username}`
  const formErrorId = `${uid}-form-error`

  const handleSubmit = useCallback(
    (formData: FormData) => {
      formData.append("id", game.id)
      if (thumbnailUrl) {
        formData.append("thumbnail_url", thumbnailUrl)
      }
      // Include platform tag + user-selected tags
      const allTagIds = platformTag
        ? [platformTag.id, ...selectedTagIds.filter((id) => id !== platformTag.id)]
        : selectedTagIds
      formData.set("tag_ids", JSON.stringify(allTagIds))
      formAction(formData)
    },
    [game.id, thumbnailUrl, platformTag, selectedTagIds, formAction]
  )

  // Redirect on success
  useEffect(() => {
    if (state?.success) {
      router.push(profileUrl)
    }
  }, [state?.success, router, profileUrl])

  return (
    <form action={handleSubmit} className="space-y-6" aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`} className="sr-only">
        Formulario para editar juego
      </h2>

      {/* Back link */}
      <Link
        href={profileUrl}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver al perfil
      </Link>

      {/* 2-column layout */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12">
        {/* ── LEFT COLUMN: Inputs ── */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título
              <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
            </Label>
            <Input id="title" name="title" required aria-required="true" defaultValue={game.title} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" defaultValue={game.description} />
          </div>

          {/* TagPicker: content tags + platform tag locked */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="text-sm font-medium">
              Selecciona etiquetas para tu juego
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({selectedTagIds.length + (platformTag ? 1 : 0)}/5)
              </span>
            </legend>
            <TagPicker
              tags={availableTags}
              selectedIds={[
                ...(platformTag ? [platformTag.id] : []),
                ...selectedTagIds,
              ]}
              onChange={(ids) => {
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
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="text-base font-semibold">Miniatura</legend>
            <ThumbnailPicker
              shortId={shortId}
              embedUrl={game.embed_url}
              onThumbnailChange={setThumbnailUrl}
              platform={game.platform ?? 'makecode'}
              currentThumbnailUrl={game.thumbnail_url}
            />
          </fieldset>

          {/* Server error */}
          {state?.error && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3">
              <p id={formErrorId} className="text-sm text-destructive font-medium">
                {state.error}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="outline" size="lg" asChild>
              <Link href={profileUrl}>Cancelar</Link>
            </Button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Preview ── */}
        <div className="mt-6 lg:mt-0 lg:sticky lg:top-6 lg:self-start space-y-4">
          <Label className="text-base font-semibold">Vista previa</Label>
          {isScratch ? (
            <ScratchEmbed url={game.embed_url} title={game.title} />
          ) : (
            <ArcadeEmbed url={game.embed_url} title={game.title} />
          )}
        </div>
      </div>
    </form>
  )
}
