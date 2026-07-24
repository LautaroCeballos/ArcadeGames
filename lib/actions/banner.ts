"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { BannerSlide } from "@/lib/definitions"

type ActionResult = { success: true } | { error: string }

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function getUserRole(): Promise<"user" | "moderator" | "admin" | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return profile?.role ?? "user"
}

async function assertAdmin(): Promise<void> {
  const role = await getUserRole()
  if (role !== "admin") {
    throw new Error("No autorizado. Se requiere rol de admin.")
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getBannerSlides(): Promise<BannerSlide[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("banner_slides")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  return (data ?? []) as BannerSlide[]
}

/** Obtiene solo los slides activos para la home pública */
export async function getActiveBannerSlides(): Promise<BannerSlide[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("banner_slides")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(10)

  return (data ?? []) as BannerSlide[]
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createBannerSlide(formData: FormData): Promise<ActionResult> {
  await assertAdmin()
  const supabase = await createClient()

  const title = formData.get("title") as string
  const description = formData.get("description") as string | null
  const ctaText = formData.get("ctaText") as string
  const ctaLink = formData.get("ctaLink") as string
  const imageUrl = formData.get("imageUrl") as string | null
  const overlayColor = formData.get("overlayColor") as string | null
  const textColor = formData.get("textColor") as string | null
  const buttonColor = formData.get("buttonColor") as string | null

  if (!title || !title.trim()) {
    return { error: "El título es obligatorio" }
  }
  if (!ctaText || !ctaText.trim()) {
    return { error: "El texto del botón es obligatorio" }
  }
  if (!ctaLink || !ctaLink.trim()) {
    return { error: "El link del botón es obligatorio" }
  }

  // Get current max sort_order
  const { data: maxSlide } = await supabase
    .from("banner_slides")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxSlide?.sort_order ?? -1) + 1

  const { error } = await supabase
    .from("banner_slides")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      cta_text: ctaText.trim(),
      cta_link: ctaLink.trim(),
      image_url: imageUrl || null,
      overlay_color: overlayColor || null,
      text_color: textColor || null,
      button_color: buttonColor || null,
      sort_order: nextOrder,
      active: true,
    })

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/admin/banner")
  return { success: true }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateBannerSlide(id: string, formData: FormData): Promise<ActionResult> {
  await assertAdmin()
  const supabase = await createClient()

  const title = formData.get("title") as string
  const description = formData.get("description") as string | null
  const ctaText = formData.get("ctaText") as string
  const ctaLink = formData.get("ctaLink") as string
  const imageUrl = formData.get("imageUrl") as string | null
  const active = formData.get("active") as string | null
  const overlayColor = formData.get("overlayColor") as string | null
  const textColor = formData.get("textColor") as string | null
  const buttonColor = formData.get("buttonColor") as string | null

  if (!title || !title.trim()) {
    return { error: "El título es obligatorio" }
  }
  if (!ctaText || !ctaText.trim()) {
    return { error: "El texto del botón es obligatorio" }
  }
  if (!ctaLink || !ctaLink.trim()) {
    return { error: "El link del botón es obligatorio" }
  }

  const updates: Record<string, unknown> = {
    title: title.trim(),
    description: description?.trim() || null,
    cta_text: ctaText.trim(),
    cta_link: ctaLink.trim(),
    updated_at: new Date().toISOString(),
  }

  if (imageUrl !== null) {
    updates.image_url = imageUrl || null
  }

  if (active !== null) {
    updates.active = active === "true"
  }

  // Color fields: always include them (null = use frontend default)
  updates.overlay_color = overlayColor || null
  updates.text_color = textColor || null
  updates.button_color = buttonColor || null

  const { error } = await supabase
    .from("banner_slides")
    .update(updates)
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/admin/banner")
  return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteBannerSlide(id: string): Promise<ActionResult> {
  await assertAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("banner_slides")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/admin/banner")
  return { success: true }
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderBannerSlides(orderedIds: string[]): Promise<ActionResult> {
  await assertAdmin()
  const supabase = await createClient()

  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index,
  }))

  // Use a simple approach: update each one (Supabase doesn't have bulk update by array)
  for (const update of updates) {
    const { error } = await supabase
      .from("banner_slides")
      .update({ sort_order: update.sort_order })
      .eq("id", update.id)

    if (error) return { error: error.message }
  }

  revalidatePath("/")
  revalidatePath("/admin/banner")
  return { success: true }
}

// ─── Image upload ─────────────────────────────────────────────────────────────

const BANNERS_BUCKET = "banners"

export async function uploadBannerImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  await assertAdmin()
  const supabase = await createClient()

  const file = formData.get("file") as File | null
  if (!file) return { error: "No se seleccionó ningún archivo" }

  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen" }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "La imagen no puede superar los 2 MB" }
  }

  const ext = file.name.split(".").pop() ?? "png"
  const fileName = `banner_${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BANNERS_BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const { data: publicUrl } = supabase.storage
    .from(BANNERS_BUCKET)
    .getPublicUrl(fileName)

  return { url: publicUrl.publicUrl }
}
