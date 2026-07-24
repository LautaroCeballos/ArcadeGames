"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ImagePlus, Pencil, Trash2, GripVertical, AlertTriangle, Loader2, EyeOff, Eye } from "lucide-react"
import { getBannerSlides, createBannerSlide, updateBannerSlide, deleteBannerSlide, reorderBannerSlides, uploadBannerImage } from "@/lib/actions/banner"
import { cn } from "@/lib/utils"
import type { BannerSlide } from "@/lib/definitions"

/** Converts a hex color like #ff0000 to rgba(r,g,b,opacity) */
function hexToRgba(hex: string, opacity = 0.4): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return `rgba(0,0,0,${opacity})`
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

interface SlideFormData {
  title: string
  description: string
  ctaText: string
  ctaLink: string
  overlayColor: string
  textColor: string
  buttonColor: string
  showPanel: boolean
  panelAlign: "left" | "center" | "right"
  panelValign: "top" | "center" | "bottom"
  buttonMode: "full" | "only" | "none"
}

const emptyForm: SlideFormData = {
  title: "",
  description: "",
  ctaText: "",
  ctaLink: "/",
  overlayColor: "#000000",
  textColor: "#ffffff",
  buttonColor: "#d90057",
  showPanel: true,
  panelAlign: "right",
  panelValign: "center",
  buttonMode: "full",
}

export function BannerAdminClient() {
  const [slides, setSlides] = useState<BannerSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SlideFormData>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [keepImage, setKeepImage] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ─── Dialog handlers ──────────────────────────────────────────────────────

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
      overlayColor: slide.overlay_color ?? "#000000",
      textColor: slide.text_color ?? "#ffffff",
      buttonColor: slide.button_color ?? "#d90057",
      showPanel: slide.show_panel ?? true,
      panelAlign: (slide.panel_align as "left" | "center" | "right") ?? "right",
      panelValign: (slide.panel_valign as "top" | "center" | "bottom") ?? "center",
      buttonMode: (slide.button_mode as "full" | "only" | "none") ?? "full",
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

  // ─── Image handlers ──────────────────────────────────────────────────────

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

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let finalImageUrl = editingId && keepImage ? (imagePreview ?? null) : null

      // Upload new image if selected
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

      // Create or update
      const submitFormData = new FormData()
      submitFormData.set("title", form.title)
      submitFormData.set("description", form.description)
      submitFormData.set("ctaText", form.ctaText)
      submitFormData.set("ctaLink", form.ctaLink)
      if (finalImageUrl !== null) {
        submitFormData.set("imageUrl", finalImageUrl)
      }
      submitFormData.set("overlayColor", form.overlayColor)
      submitFormData.set("textColor", form.textColor)
      submitFormData.set("buttonColor", form.buttonColor)
      submitFormData.set("showPanel", form.showPanel ? "true" : "false")
      submitFormData.set("panelAlign", form.panelAlign)
      submitFormData.set("panelValign", form.panelValign)
      submitFormData.set("buttonMode", form.buttonMode)

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

  // ─── Delete ──────────────────────────────────────────────────────────────

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

  // ─── Reorder ─────────────────────────────────────────────────────────────

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

  // ─── Render ──────────────────────────────────────────────────────────────

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
                  {slide.show_panel === false && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] text-yellow-700">
                      <EyeOff className="h-3 w-3" /> Panel oculto
                    </span>
                  )}
                  {slide.panel_align && slide.panel_align !== "right" && slide.show_panel !== false && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                      {slide.panel_align === "left" ? "Izquierda" : "Centro"}
                    </span>
                  )}
                  {slide.button_mode && slide.button_mode !== "full" && slide.show_panel !== false && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] text-purple-700">
                      {slide.button_mode === "only" ? "Solo botón" : "Sin botón"}
                    </span>
                  )}
                  {slide.panel_valign && slide.panel_valign !== "center" && slide.show_panel !== false && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] text-teal-700">
                      {slide.panel_valign === "top" ? "Arriba" : "Abajo"}
                    </span>
                  )}
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
                <div className="relative overflow-hidden rounded-[8px] bg-gradient-to-br from-arcade-dark to-arcade-red/80 h-[180px]">
                  {/* Image or placeholder */}
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-10">
                      <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--arcade-red)_0%,_transparent_60%)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--arcade-green)_0%,_transparent_60%)]" />
                    </div>
                  )}

                  {!form.showPanel && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <span className="rounded-md bg-black/50 px-2 py-1 text-[10px] text-white/70 backdrop-blur-sm">
                        Panel oculto
                      </span>
                    </div>
                  )}

                  {/* Mini floating panel in the preview (full or none mode) */}
                  {form.showPanel && form.buttonMode !== "only" && (
                    <div
                      className={cn(
                        "absolute z-10 rounded-lg backdrop-blur-sm flex items-center justify-center",
                        // vertical positioning
                        form.panelValign === "top" && "top-2 bottom-auto",
                        form.panelValign === "center" && "top-1/2 -translate-y-1/2",
                        form.panelValign === "bottom" && "bottom-2 top-auto",
                        "left-2 right-2",
                        form.panelAlign === "left" && "sm:left-2 sm:right-auto",
                        form.panelAlign === "center" && "sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:right-auto sm:max-w-[50%]",
                        form.panelAlign === "right" && "sm:left-auto sm:right-2",
                      )}
                      style={{ backgroundColor: hexToRgba(form.overlayColor || "#000000") }}
                    >
                      <div className="flex flex-col items-center gap-1 px-3 py-2 sm:px-4 sm:py-3">
                        {/* Title + description (always shown here since buttonMode !== 'only') */}
                        <p
                          className="text-center text-xs font-bold leading-tight sm:text-sm"
                          style={{ color: form.textColor || "#ffffff" }}
                        >
                          {form.title || "Título del slide"}
                        </p>
                        {form.description && (
                          <p
                            className="max-w-[180px] text-center text-[10px] leading-tight sm:max-w-[240px] sm:text-xs"
                            style={{ color: form.textColor ? `${form.textColor}cc` : "rgba(255,255,255,0.8)" }}
                          >
                            {form.description}
                          </p>
                        )}
                        {/* Button shown only if not 'none' */}
                        {form.buttonMode === "full" && (
                          <span
                            className="inline-flex items-center justify-center rounded-[10px] px-3 py-1 text-[10px] font-semibold sm:rounded-[12px] sm:px-4 sm:py-1 sm:text-xs"
                            style={{
                              backgroundColor: form.buttonColor || "#d90057",
                              color: form.textColor || "#ffffff",
                            }}
                          >
                            {form.ctaText || "BOTÓN"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* buttonMode === 'only': render just the button, no backdrop */}
                  {form.showPanel && form.buttonMode === "only" && (
                    <div
                      className={cn(
                        "absolute z-10 flex items-center justify-center",
                        // vertical positioning
                        form.panelValign === "top" && "top-2 bottom-auto",
                        form.panelValign === "center" && "top-1/2 -translate-y-1/2",
                        form.panelValign === "bottom" && "bottom-2 top-auto",
                        "left-2 right-2",
                        form.panelAlign === "left" && "sm:left-2 sm:right-auto",
                        form.panelAlign === "center" && "sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:right-auto",
                        form.panelAlign === "right" && "sm:left-auto sm:right-2",
                      )}
                    >
                      <span
                        className="inline-flex items-center justify-center rounded-[10px] px-3 py-1 text-[10px] font-semibold shadow-lg sm:rounded-[12px] sm:px-4 sm:py-1 sm:text-xs"
                        style={{
                          backgroundColor: form.buttonColor || "#d90057",
                          color: form.textColor || "#ffffff",
                        }}
                      >
                        {form.ctaText || "BOTÓN"}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Panel options ── */}
                <div className="mt-4 space-y-3 rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Opciones del panel</p>

                  {/* Show panel toggle */}
                  <label className="flex cursor-pointer items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.showPanel}
                      onClick={() => setForm({ ...form, showPanel: !form.showPanel })}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
                        form.showPanel ? "bg-arcade-red" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                        form.showPanel ? "translate-x-4" : "translate-x-0"
                      )} />
                    </button>
                    <span className="text-sm">Mostrar panel flotante</span>
                  </label>

                  {/* Alignment + Button mode (only if panel is shown) */}
                  {form.showPanel && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-[11px] text-muted-foreground">Alineación horizontal</label>
                        <div className="flex gap-1 rounded-lg border p-1">
                          {(["left", "center", "right"] as const).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => setForm({ ...form, panelAlign: align })}
                              className={cn(
                                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                form.panelAlign === align
                                  ? "bg-arcade-red text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {align === "left" ? "Izquierda" : align === "center" ? "Centro" : "Derecha"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] text-muted-foreground">Alineación vertical</label>
                        <div className="flex gap-1 rounded-lg border p-1">
                          {([["top", "Arriba"], ["center", "Centro"], ["bottom", "Abajo"]] as const).map(([valign, label]) => (
                            <button
                              key={valign}
                              type="button"
                              onClick={() => setForm({ ...form, panelValign: valign })}
                              className={cn(
                                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                form.panelValign === valign
                                  ? "bg-arcade-red text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] text-muted-foreground">Botón</label>
                        <div className="flex gap-1 rounded-lg border p-1">
                          {([["full", "Completo"], ["only", "Solo botón"], ["none", "Sin botón"]] as const).map(([mode, label]) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setForm({ ...form, buttonMode: mode })}
                              className={cn(
                                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                form.buttonMode === mode
                                  ? "bg-arcade-red text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Color swatches */}
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Colores</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-muted-foreground">Fondo panel</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.overlayColor}
                          onChange={(e) => setForm({ ...form, overlayColor: e.target.value })}
                          className="h-7 w-7 cursor-pointer rounded border"
                        />
                        <input
                          type="text"
                          value={form.overlayColor}
                          onChange={(e) => setForm({ ...form, overlayColor: e.target.value })}
                          className="flex-1 rounded-md border bg-background px-1.5 py-1 text-[11px] outline-none focus:border-arcade-red"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-muted-foreground">Texto</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.textColor}
                          onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                          className="h-7 w-7 cursor-pointer rounded border"
                        />
                        <input
                          type="text"
                          value={form.textColor}
                          onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                          className="flex-1 rounded-md border bg-background px-1.5 py-1 text-[11px] outline-none focus:border-arcade-red"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-muted-foreground">Botón</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.buttonColor}
                          onChange={(e) => setForm({ ...form, buttonColor: e.target.value })}
                          className="h-7 w-7 cursor-pointer rounded border"
                        />
                        <input
                          type="text"
                          value={form.buttonColor}
                          onChange={(e) => setForm({ ...form, buttonColor: e.target.value })}
                          className="flex-1 rounded-md border bg-background px-1.5 py-1 text-[11px] outline-none focus:border-arcade-red"
                        />
                      </div>
                    </div>
                  </div>
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
          Arrastrá con los botones de orden para reordenar.
        </p>
      )}
    </div>
  )
}
