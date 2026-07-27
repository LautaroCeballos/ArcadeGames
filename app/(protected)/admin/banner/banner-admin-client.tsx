"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ImagePlus, Pencil, Trash2, AlertTriangle, Loader2, EyeOff } from "lucide-react"
import { getBannerSlides, createBannerSlide, updateBannerSlide, deleteBannerSlide, reorderBannerSlides, uploadBannerImage } from "@/lib/actions/banner"
import { cn } from "@/lib/utils"
import { useDominantColors } from "@/hooks/use-dominant-colors"
import type { BannerSlide } from "@/lib/definitions"

interface SlideFormData {
  title: string
  description: string
  ctaText: string
  ctaLink: string
  template: string
  clickable: boolean
  openInNewTab: boolean
}

const emptyForm: SlideFormData = {
  title: "",
  description: "",
  ctaText: "",
  ctaLink: "/",
  template: "bar-right",
  clickable: true,
  openInNewTab: true,
}

const templates = [
  { id: "bar-right", label: "Barra derecha", desc: "Texto a la izquierda, imagen a la derecha. Split 50/50." },
  { id: "bar-left", label: "Barra izquierda", desc: "Imagen a la izquierda, texto a la derecha. Split 50/50." },
  { id: "full-image", label: "Imagen completa", desc: "Imagen 100%, sin texto visible. Todo el slide es clickeable." },
] as const

function hexToRgba(_hex: string, _opacity = 0.4): string {
  return "rgba(0,0,0,0.6)"
}

export function BannerAdminClient() {
  const [slides, setSlides] = useState<BannerSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SlideFormData>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [keepImage, setKeepImage] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dominantColors = useDominantColors(imagePreview ?? "")

  const fetchSlides = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBannerSlides()
      setSlides(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar slides")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setKeepImage(true)
    setDialogOpen(true)
  }

  const openEditDialog = (slide: BannerSlide) => {
    setEditingId(slide.id)
    setForm({
      title: slide.title,
      description: slide.description ?? "",
      ctaText: slide.cta_text,
      ctaLink: slide.cta_link,
      template: slide.template || "bar-right",
      clickable: slide.clickable ?? true,
      openInNewTab: slide.open_in_new_tab ?? true,
    })
    setImageFile(null)
    setImagePreview(slide.image_url)
    setKeepImage(!!slide.image_url)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setKeepImage(true)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar los 2 MB")
      return
    }

    setImageFile(file)
    setKeepImage(false)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setKeepImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let finalImageUrl = editingId && keepImage ? (imagePreview ?? null) : null

      if (imageFile) {
        const imgFormData = new FormData()
        imgFormData.set("file", imageFile)
        const uploadResult = await uploadBannerImage(imgFormData)
        if ("error" in uploadResult) {
          setError(uploadResult.error)
          setSaving(false)
          return
        }
        finalImageUrl = uploadResult.url
      }

      const submitFormData = new FormData()
      submitFormData.set("title", form.title)
      submitFormData.set("description", form.description)
      submitFormData.set("ctaText", form.ctaText)
      submitFormData.set("ctaLink", form.ctaLink)
      submitFormData.set("template", form.template)
      submitFormData.set("clickable", form.clickable ? "on" : "off")
      submitFormData.set("openInNewTab", form.openInNewTab ? "on" : "off")
      if (finalImageUrl !== null) {
        submitFormData.set("imageUrl", finalImageUrl)
      }

      let result
      if (editingId) {
        result = await updateBannerSlide(editingId, submitFormData)
      } else {
        result = await createBannerSlide(submitFormData)
      }

      if ("error" in result) {
        setError(result.error)
        return
      }

      closeDialog()
      fetchSlides()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este slide del banner?")) return
    setError(null)
    try {
      const result = await deleteBannerSlide(id)
      if ("error" in result) {
        setError(result.error)
      } else {
        fetchSlides()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  const moveSlide = async (index: number, direction: "up" | "down") => {
    const newSlides = [...slides]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSlides.length) return

    ;[newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]]
    setSlides(newSlides)

    try {
      await reorderBannerSlides(newSlides.map((s) => s.id))
    } catch {
      fetchSlides()
    }
  }

  const templateLabel = (id: string) => templates.find((t) => t.id === id)?.label ?? id

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImagePlus className="h-8 w-8 text-arcade-red" />
          <div>
            <h1 className="text-2xl font-bold">Banner Principal</h1>
            <p className="text-sm text-muted-foreground">
              Gestioná los slides del banner del home
            </p>
          </div>
        </div>
        <button
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 rounded-lg bg-arcade-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-arcade-red/90"
        >
          <ImagePlus className="h-4 w-4" />
          Nuevo Slide
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && slides.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <ImagePlus className="h-16 w-16" />
          <p className="text-lg font-medium">No hay slides</p>
          <p className="text-sm">Creá el primer slide del banner del home.</p>
          <button
            onClick={openCreateDialog}
            className="mt-2 rounded-lg bg-arcade-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-arcade-red/90"
          >
            Crear Slide
          </button>
        </div>
      )}

      {/* Slides list */}
      {!loading && slides.length > 0 && (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => moveSlide(index, "up")}
                  disabled={index === 0}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Mover arriba"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>
                <span className="text-center text-xs text-muted-foreground">{index + 1}</span>
                <button
                  type="button"
                  onClick={() => moveSlide(index, "down")}
                  disabled={index === slides.length - 1}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Mover abajo"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Preview thumbnail */}
              <div className="relative h-24 w-48 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-arcade-dark to-arcade-red/80">
                {slide.image_url ? (
                  <img
                    src={slide.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImagePlus className="h-8 w-8 text-arcade-beige/40" />
                  </div>
                )}
                {!slide.active && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="flex items-center gap-1 text-xs text-white">
                      <EyeOff className="h-3 w-3" /> Oculta
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{slide.title}</h3>
                {slide.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {slide.description}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-arcade-red/10 px-2 py-0.5 text-[11px] font-medium text-arcade-red">
                    {slide.cta_text}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {slide.cta_link}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                    {templateLabel(slide.template || "bar-right")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openEditDialog(slide)}
                  className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Editar ${slide.title}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(slide.id)}
                  className="rounded-md border p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={`Eliminar ${slide.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-4xl flex-col gap-0 overflow-hidden rounded-xl border bg-card shadow-lg sm:flex-row">
            {/* ── Form side ── */}
            <div className="flex max-h-[90vh] w-full flex-col overflow-y-auto sm:w-1/2">
              <div className="p-6">
                <h2 className="text-lg font-semibold">
                  {editingId ? "Editar Slide" : "Nuevo Slide"}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {editingId
                    ? "Modificá el contenido del slide."
                    : "Agregá un nuevo slide al banner del home."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Image upload */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Imagen de fondo</label>
                    {imagePreview ? (
                      <div className="relative mb-2 overflow-hidden rounded-lg border">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-full object-cover sm:h-28"
                        />
                        <div className="absolute right-2 top-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-md bg-black/60 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/80"
                            aria-label="Reemplazar imagen"
                          >
                            <ImagePlus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="rounded-md bg-black/60 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/80"
                            aria-label="Eliminar imagen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {editingId && (
                          <p className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white backdrop-blur">
                            {imageFile ? "Nueva imagen" : "Imagen actual"}
                          </p>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <label className="mb-2 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors hover:border-arcade-red/50 hover:text-arcade-red">
                        <ImagePlus className="h-6 w-6" />
                        <span>Seleccionar imagen</span>
                        <span className="text-xs">PNG, JPG o WEBP — Máx 2 MB</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                      maxLength={100}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-arcade-red focus:ring-1 focus:ring-arcade-red"
                      placeholder="Ej: Bienvenido a ArcadePlay"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
                      Subtítulo
                    </label>
                    <input
                      id="description"
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      maxLength={200}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-arcade-red focus:ring-1 focus:ring-arcade-red"
                      placeholder="Ej: Descubrí juegos creados con MakeCode Arcade"
                    />
                  </div>

                  {/* CTA row */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ctaText" className="mb-1.5 block text-sm font-medium">
                        Texto del botón <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ctaText"
                        type="text"
                        value={form.ctaText}
                        onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                        required
                        maxLength={30}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-arcade-red focus:ring-1 focus:ring-arcade-red"
                        placeholder="Ej: SABER MÁS"
                      />
                    </div>
                    <div>
                      <label htmlFor="ctaLink" className="mb-1.5 block text-sm font-medium">
                        Link <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ctaLink"
                        type="text"
                        value={form.ctaLink}
                        onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                        required
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-arcade-red focus:ring-1 focus:ring-arcade-red"
                        placeholder="Ej: /juego/123"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !form.title.trim() || !form.ctaText.trim() || !form.ctaLink.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-arcade-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-arcade-red/90 disabled:opacity-50"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {editingId ? "Guardar cambios" : "Crear slide"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ── Preview side ── */}
            <div className="hidden border-l bg-muted/30 sm:flex sm:w-1/2 sm:flex-col">
              <div className="p-6">
                <p className="mb-3 text-sm font-medium">Vista previa</p>
                <div
                  className="relative overflow-hidden rounded-[8px] aspect-[3/1]"
                  style={dominantColors ? { background: `linear-gradient(135deg, ${dominantColors[0]}, ${dominantColors[1]})` } : undefined}
                >
                  {/* Image or placeholder */}
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-10" style={dominantColors ? { background: `linear-gradient(135deg, ${dominantColors[0]}, ${dominantColors[1]})` } : undefined}>
                      <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--arcade-red)_0%,_transparent_60%)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--arcade-green)_0%,_transparent_60%)]" />
                    </div>
                  )}

                  {/* Render according to template */}
                  {form.template === "full-image" ? (
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  ) : (
                    <div className="flex h-full">
                      <div className={cn(
                        "flex w-[25%] flex-col justify-center gap-1 p-3",
                        form.template === "bar-left" ? "order-2" : "order-1",
                      )}>
                        <p className="text-[9px] font-bold leading-tight text-white">
                          {form.title || "Título"}
                        </p>
                        {form.description && (
                          <p className="text-[7px] leading-tight text-white/80">
                            {form.description}
                          </p>
                        )}
                        <span className="inline-flex w-fit items-center justify-center rounded-[6px] bg-arcade-red px-2 py-1 text-[7px] font-semibold text-white">
                          {form.ctaText || "BOTÓN"}
                        </span>
                      </div>
                      <div className={cn(
                        "flex w-[75%] items-center justify-center bg-gradient-to-br from-arcade-dark/60 to-arcade-red/60",
                        form.template === "bar-left" ? "order-1" : "order-2",
                      )}>
                        <svg className="h-6 w-6 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Template selector ── */}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Plantilla</p>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, template: t.id })}
                        className={cn(
                          "rounded-lg border-2 p-2 text-left transition-colors",
                          form.template === t.id
                            ? "border-arcade-red bg-arcade-red/5"
                            : "border-transparent bg-muted/50 hover:bg-muted",
                        )}
                      >
                        {/* Mini visual representation */}
                        <div className="mb-1.5 h-10 w-full overflow-hidden rounded bg-gradient-to-br from-arcade-dark to-arcade-red/80">
                          {t.id === "full-image" ? (
                            <div className="flex h-full items-center justify-center">
                              <ImagePlus className="h-4 w-4 text-white/40" />
                            </div>
                          ) : (
                            <div className="flex h-full">
                              <div className={cn(
                                "flex w-1/2 items-center justify-center bg-gradient-to-br from-arcade-dark/40 to-arcade-red/40",
                                t.id === "bar-left" && "order-2",
                              )}>
                                <svg className="h-3 w-3 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M4 6h16M4 12h16M4 18h12" />
                                </svg>
                              </div>
                              <div className={cn(
                                "flex w-1/2 items-center justify-center bg-gradient-to-br from-arcade-dark/60 to-arcade-red/60",
                                t.id === "bar-left" && "order-1",
                              )}>
                                <svg className="h-3 w-3 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <path d="m21 15-5-5L5 21" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-medium leading-tight">{t.label}</p>
                        <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Full-image options ── */}
                {form.template === "full-image" && (
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.clickable}
                        onChange={(e) => setForm({ ...form, clickable: e.target.checked })}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">
                        La imagen es un enlace cliqueable
                      </span>
                    </label>
                    {form.clickable && (
                      <label className="flex items-center gap-2 cursor-pointer pl-6">
                        <input
                          type="checkbox"
                          checked={form.openInNewTab}
                          onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        <span className="text-xs text-muted-foreground">
                          Abrir en una nueva pestaña
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
      )}

      {/* Info */}
      {!loading && slides.length > 0 && (
        <p className="mt-6 text-xs text-muted-foreground">
          Los slides se muestran en el orden indicado. Solo se muestran en el home los slides activos.
        </p>
      )}
    </div>
  )
}
