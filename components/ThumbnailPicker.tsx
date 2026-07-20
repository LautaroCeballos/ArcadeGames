"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { fetchProjectThumbnailUrl } from "@/lib/game-utils"
import { uploadThumbnail } from "@/lib/actions/thumbnails"
import { Camera, Loader2, Check, X, ImageUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ThumbnailPickerProps {
  shortId: string | null
  embedUrl: string | null
  onThumbnailChange: (url: string | null) => void
  platform?: 'makecode' | 'scratch'
}

type ThumbnailOption = {
  id: string
  url: string
  label: string
  source: "auto" | "upload"
}

export function ThumbnailPicker({ shortId, embedUrl, onThumbnailChange, platform = 'makecode' }: ThumbnailPickerProps) {
  const [options, setOptions] = useState<ThumbnailOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Fetch auto-thumbnail (MakeCode only) ──
  useEffect(() => {
    if (!shortId || platform === 'scratch') {
      setOptions([])
      setSelectedId(null)
      return
    }

    let cancelled = false
    setIsFetching(true)

    fetchProjectThumbnailUrl(shortId)
      .then((url) => {
        if (cancelled) return
        if (url) {
          const opt: ThumbnailOption = {
            id: "auto",
            url,
            label: "Oficial (auto)",
            source: "auto",
          }
          setOptions([opt])
          setSelectedId("auto")
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsFetching(false)
      })

    return () => { cancelled = true }
  }, [shortId, platform])

  // ── Notify parent of selection ──
  useEffect(() => {
    const selected = options.find((o) => o.id === selectedId)
    onThumbnailChange(selected?.url ?? null)
  }, [selectedId, options, onThumbnailChange])

  // ── File upload ──
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const result = await uploadThumbnail(fd)

      if ("error" in result) {
        console.error(result.error)
        return
      }

      const id = `upload-${Date.now()}`

      setOptions((prev) => [
        { id, url: result.url, label: "Subida", source: "upload" },
        ...prev,
      ])
      setSelectedId(id)
    } finally {
      setIsUploading(false)
    }

    if (fileRef.current) fileRef.current.value = ""
  }, [])

  const removeOption = useCallback(
    (id: string) => {
      setOptions((prev) => {
        const next = prev.filter((o) => o.id !== id)
        if (next.length > 0 && selectedId === id) {
          setSelectedId(next[0].id)
        } else if (next.length === 0) {
          setSelectedId(null)
        }
        return next
      })
    },
    [selectedId]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none">
          Miniatura del juego
        </label>
        {selectedId && (
          <span className="text-xs text-muted-foreground">
            {options.find((o) => o.id === selectedId)?.label ?? "Seleccionada"}
          </span>
        )}
      </div>

      {/* ── Thumbnail grid ── */}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <div
              key={opt.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(opt.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedId(opt.id) }}
              className={`group relative aspect-video w-[140px] overflow-hidden rounded-lg border-2 transition cursor-pointer sm:w-[160px] ${
                selectedId === opt.id
                  ? "border-arcade-red ring-1 ring-arcade-red/30"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={opt.url}
                alt={opt.label}
                className="h-full w-full object-cover"
              />
              {selectedId === opt.id && (
                <div className="absolute right-1 bottom-1 flex items-center gap-1 rounded-full bg-arcade-red px-1.5 py-0.5 text-[10px] font-medium text-white pointer-events-none">
                  <Check className="size-2.5" />
                </div>
              )}
              {opt.source === "upload" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeOption(opt.id)
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
                  aria-label="Quitar"
                >
                  <X className="size-3" />
                </button>
              )}
              <span className="absolute left-1 bottom-1 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white/80 pointer-events-none">
                {opt.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Options ── */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
        {isFetching ? (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Buscando miniatura oficial…
          </div>
        ) : options.find((o) => o.source === "auto") ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageUp className="size-4" />
              )}
              {isUploading ? "Subiendo…" : "Subir mi propia imagen"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleFileUpload}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">
              No se encontró miniatura oficial para este juego
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {isUploading ? "Subiendo…" : "Subir imagen"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>

      {options.length === 0 && !isFetching && (
        <p className="text-xs text-muted-foreground/60">
          {platform === 'scratch'
            ? "Subí una imagen para la miniatura del juego"
            : "Completá la URL del juego para obtener la miniatura oficial, o subí tu propia imagen"}
        </p>
      )}
    </div>
  )
}
