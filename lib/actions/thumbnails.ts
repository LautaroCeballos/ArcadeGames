"use server"

import { createClient } from "@/lib/supabase/server"

const BUCKET = "game-thumbnails"

export async function uploadThumbnail(formData: FormData): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  const file = formData.get("file") as File | null
  if (!file) return { error: "No se seleccionó ningún archivo" }

  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen" }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "La imagen no puede superar los 2 MB" }
  }

  const ext = file.name.split(".").pop() ?? "png"
  const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const { data: publicUrl } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName)

  return { url: publicUrl.publicUrl }
}
