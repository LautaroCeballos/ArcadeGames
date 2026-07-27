"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ImagePlus, Pencil, Trash2, AlertTriangle, Loader2, EyeOff, X, MoreVertical } from "lucide-react"
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
  duration: number
}

const emptyForm: SlideFormData = {
  title: "",
  description: "",
  ctaText: "",
  ctaLink: "/",
  template: "bar-right",
  clickable: true,
  openInNewTab: true,
  duration: 5,
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SlideFormData>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [keepImage, setKeepImage] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dominantColors = useDominantColors(imagePreview ?? "")

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (dialogOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [dialogOpen])

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
      duration: slide.duration ?? 5,
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
            <h1 className="text-xl font-bold sm:text-2xl">Banner Principal</h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Gestioná los slides del banner del home
            </p>
          </div>
        </div>
        <button
          onClick={openCreateDialog}
          className="inline-flex items-center gap-1.5 rounded-lg bg-arcade-red px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-arcade-red/90 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
        >
          <ImagePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="sm:hidden">Nuevo</span>
          <span className="hidden sm:inline">Nuevo Slide</span>
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
          <p className="text-base font-medium sm:text-lg">No hay slides</p>
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
              className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30 sm:gap-4 sm:p-4"
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
              <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-arcade-dark to-arcade-red/80 sm:h-24 sm:w-48">
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
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="truncate text-sm font-semibold">{slide.title}</h3>
                {slide.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {slide.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span><span className="text-foreground/60">Botón:</span> <span className="font-medium text-foreground">{slide.cta_text}</span></span>
                  <span><span className="text-foreground/60">Link:</span> {slide.cta_link}</span>
                  <span><span className="text-foreground/60">Plantilla:</span> {templateLabel(slide.template || "bar-right")}</span>
                  <span>
                    <span className="text-foreground/60">Enlace:</span>{" "}
                    {slide.template === "full-image"
                      ? (slide.clickable ? "Clickable" : "No clickable")
                      : (slide.open_in_new_tab ? "Nueva pestaña" : "Misma pestaña")}
                    {slide.template === "full-image" && slide.clickable && slide.open_in_new_tab && " + Nueva pestaña"}
                  </span>
                  <span><span className="text-foreground/60">Duración:</span> {slide.duration ?? 5}s</span>
                </div>
              </div>

              {/* Actions — desktop */}
              <div className="hidden shrink-0 gap-2 sm:flex">
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

              {/* Actions — mobile kebab menu */}
              <div className="relative shrink-0 sm:hidden">
                <button
                  type="button"
                  onClick={() => setOpenMenuId(openMenuId === slide.id ? null : slide.id)}
                  className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-muted"
                  aria-label="Acciones"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {openMenuId === slide.id && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border bg-card shadow-lg">
                    <button
                      type="button"
                      onClick={() => { setOpenMenuId(null); openEditDialog(slide) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenMenuId(null); handleDelete(slide.id) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative flex w-full max-w-4xl max-h-[90vh] flex-col gap-0 overflow-y-auto rounded-xl border bg-card shadow-lg sm:max-h-none sm:flex-row sm:overflow-hidden">
            {/* ── Close button ── */}
            <button
              type="button"
              onClick={closeDialog}
              className="absolute top-3 right-3 z-10 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
            {/* ── Form side ── */}
            <div className="flex w-full flex-col sm:max-h-[90vh] sm:overflow-y-auto sm:w-1/2">
              <div className="px-6 pt-6 pb-3 sm:p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                  {editingId ? (
                    <><Pencil className="h-5 w-5 text-arcade-red" /> Editar Slide</>
                  ) : (
                    <><ImagePlus className="h-5 w-5 text-arcade-red" /> Nuevo Slide</>
                  )}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {editingId
                    ? "Modificá el contenido del slide."
                    : "Agregá un nuevo slide al banner del home."}
                </p>

                <form id="slide-form" onSubmit={handleSubmit} className="space-y-5">
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
                </form>
              </div>
            </div>

            {/* ── Preview side ── */}
            <div className="flex flex-col bg-muted/30 sm:border-l sm:w-1/2">
              <div className="px-6 pt-3 pb-6 sm:p-6 space-y-4">
                {/* ── Template selector ── */}
                <div>
                  <p className="mb-1.5 text-sm font-medium">Plantilla</p>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, template: t.id })}
                        className={cn(
                          "cursor-pointer rounded-lg border p-2 text-left transition-all",
                          form.template === t.id
                            ? "border-arcade-red bg-arcade-red/5 shadow-sm"
                            : "border-border bg-background hover:border-arcade-red/40",
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

                {/* ── Link options ── */}
                <div>
                  <p className="mb-1.5 text-sm font-medium">Enlace</p>
                  {form.template === "full-image" ? (
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:border-arcade-red/30">
                        <input
                          type="checkbox"
                          checked={form.clickable}
                          onChange={(e) => setForm({ ...form, clickable: e.target.checked })}
                          className="h-4 w-4 rounded accent-arcade-red"
                        />
                        <span className="text-sm">
                          La imagen es un enlace cliqueable
                        </span>
                      </label>
                      {form.clickable && (
                        <label className="flex items-center gap-2.5 cursor-pointer rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:border-arcade-red/30">
                          <input
                            type="checkbox"
                            checked={form.openInNewTab}
                            onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })}
                            className="h-4 w-4 rounded accent-arcade-red"
                          />
                          <span className="text-sm">
                            Abrir en una nueva pestaña
                          </span>
                        </label>
                      )}
                    </div>
                  ) : (
                    <label className="flex items-center gap-2.5 cursor-pointer rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:border-arcade-red/30">
                      <input
                        type="checkbox"
                        checked={form.openInNewTab}
                        onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })}
                        className="h-4 w-4 rounded accent-arcade-red"
                      />
                      <span className="text-sm">
                        Abrir CTA en nueva pestaña
                      </span>
                    </label>
                  )}
                </div>

                {/* ── Duration ── */}
                <div>
                  <p className="mb-1.5 text-sm font-medium">Duración</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="duration"
                      form="slide-form"
                      min={2}
                      max={30}
                      value={form.duration ?? 5}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        setForm({ ...form, duration: isNaN(v) ? 5 : v })
                      }}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10)
                        const clamped = isNaN(v) ? 5 : Math.max(2, Math.min(30, v))
                        setForm({ ...form, duration: clamped })
                      }}
                      className="w-20 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-arcade-red focus:ring-1 focus:ring-arcade-red"
                    />
                    <span className="text-sm text-muted-foreground">segundos (2–30)</span>
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t">
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
                    form="slide-form"
                    disabled={saving || !form.title.trim() || !form.ctaText.trim() || !form.ctaLink.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-arcade-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-arcade-red/90 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingId ? "Guardar cambios" : "Crear slide"}
                  </button>
                </div>
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
