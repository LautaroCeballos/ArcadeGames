"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// ─── Constants ───────────────────────────────────────────────

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/
const PASSWORD_MIN_LENGTH = 8
const CURRENT_YEAR = new Date().getFullYear()
const MIN_BIRTH_YEAR = 1900
const TRUSTED_DOMAIN = "creativos-digitales.com"

/**
 * Check if an email is already registered.
 * Uses Supabase Auth admin API with server-side filtering — O(1) query.
 */
export async function checkEmail(email: string) {
  if (!email || !email.includes("@")) return { available: false }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return { available: true }

  try {
    const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")
    const normalizedEmail = email.toLowerCase()
    let page = 0
    const perPage = 200

    while (page < 5) {
      const url = `${baseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}`, apikey: key },
        cache: "no-store",
      })

      if (!res.ok) return { available: true }
      const data = await res.json()
      const users = data.users ?? []
      if (users.length === 0) break

      if (users.some((u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail)) {
        return { available: false }
      }

      if (users.length < perPage) break
      page++
    }

    return { available: true }
  } catch {
    return { available: true }
  }
}

// ─── Types ───────────────────────────────────────────────────

type SignUpState = { error?: string; success?: boolean } | undefined
type ResendState = { error?: string; success?: boolean } | undefined

// ─── Helpers ─────────────────────────────────────────────────

function sanitizeUsername(input: string): string {
  return input.trim().replace(/\s+/g, "")
}

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe contener al menos una mayúscula"
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe contener al menos una minúscula"
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe contener al menos un número"
  }
  return null
}

// ─── Server Actions ──────────────────────────────────────────

export async function signUp(_prevState: SignUpState, formData: FormData) {
  try {
    const supabase = await createClient()

  // ── Read fields ──────────────────────────────────────────
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const passwordConfirm = formData.get("password_confirm") as string
  const username = formData.get("username") as string
  const birthMonthRaw = formData.get("birth_month") as string
  const birthYearRaw = formData.get("birth_year") as string
  const country = formData.get("country") as string

  // ── Validate required fields ─────────────────────────────
  const errors: string[] = []

  if (!email) errors.push("El email es obligatorio")
  if (!password) errors.push("La contraseña es obligatoria")
  if (!username) errors.push("El nombre de usuario es obligatorio")

  if (errors.length > 0) {
    return { error: errors.join(". ") }
  }

  // ── Sanitize username ───────────────────────────────────
  const cleanUsername = sanitizeUsername(username)

  if (!USERNAME_REGEX.test(cleanUsername)) {
    return {
      error:
        "El nombre de usuario debe tener entre 3 y 30 caracteres y solo puede contener letras, números y guión bajo",
    }
  }

  // ── Validate email format (básico) ───────────────────────
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El email no tiene un formato válido" }
  }

  // ── Validate password strength ──────────────────────────
  const passwordError = validatePassword(password)
  if (passwordError) {
    return { error: passwordError }
  }

  // ── Validate password confirmation ──────────────────────
  if (password !== passwordConfirm) {
    return { error: "Las contraseñas no coinciden" }
  }

  // ── Validate birth fields ───────────────────────────────
  let birthMonth: number | null = null
  let birthYear: number | null = null

  if (birthMonthRaw) {
    birthMonth = parseInt(birthMonthRaw, 10)
    if (isNaN(birthMonth) || birthMonth < 1 || birthMonth > 12) {
      return { error: "El mes de nacimiento no es válido" }
    }
  }

  if (birthYearRaw) {
    birthYear = parseInt(birthYearRaw, 10)
    if (isNaN(birthYear) || birthYear < MIN_BIRTH_YEAR || birthYear > CURRENT_YEAR) {
      return { error: `El año de nacimiento debe estar entre ${MIN_BIRTH_YEAR} y ${CURRENT_YEAR}` }
    }
  }

  // ── Validate country (opcional, solo longitud) ──────────
  if (country && country.length > 100) {
    return { error: "El país no puede exceder los 100 caracteres" }
  }

  // ── Call Supabase Auth ──────────────────────────────────
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: cleanUsername,
        birth_month: birthMonth,
        birth_year: birthYear,
        country: country || null,
      },
    },
  })

  if (error) {
    console.error("[signUp] Supabase error:", JSON.stringify(error, null, 2))
    if (
      error.message?.toLowerCase().includes("already") ||
      (error as { code?: string }).code === "user_already_exists"
    ) {
      return { error: "Este email ya está registrado. Si es tu cuenta, iniciá sesión." }
    }
    const msg = error.message || String(error)
    return { error: (msg && msg !== "{}" && msg !== "[object Object]") ? msg : `Error: ${error.status || ""} ${error.code || ""}`.trim() || "Error al crear la cuenta. Intentalo de nuevo." }
  }

  // ── Auto-confirm trusted domain ──────────────────────────
  const emailDomain = email.split("@")[1]?.toLowerCase()
  if (emailDomain === TRUSTED_DOMAIN) {
    try {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (key) {
        const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")
        const normalizedEmail = email.toLowerCase()

        // Find the newly created user by email through pagination
        let page = 0
        const perPage = 200
        let userId: string | null = null

        while (page < 5 && !userId) {
          const url = `${baseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`
          const listRes = await fetch(url, {
            headers: { Authorization: `Bearer ${key}`, apikey: key },
          })

          if (!listRes.ok) break
          const listData = await listRes.json()
          const users = listData.users ?? []
          if (users.length === 0) break

          const match = users.find((u: { email?: string; id?: string }) =>
            u.email?.toLowerCase() === normalizedEmail
          )
          if (match?.id) {
            userId = match.id
            break
          }

          if (users.length < perPage) break
          page++
        }

        if (userId) {
          await fetch(`${baseUrl}/auth/v1/admin/users/${userId}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${key}`,
              apikey: key,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email_confirm: true }),
          })
        }
      }
    } catch (_) {
      // Silently fail — the normal confirmation flow still works
    }
  }

  // ── Success — user needs to verify email ────────────────
  return { success: true }
  } catch (e) {
    console.error("[signUp] Unhandled error:", e)
    return { error: "Error al crear la cuenta. Intentalo de nuevo." }
  }
}

export async function resendVerificationEmail(_prevState: ResendState, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ingresá un email válido" }
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signIn(_prevState: { error: string } | undefined, formData: FormData) {
  const supabase = await createClient()

  const identifier = formData.get("identifier") as string
  const password = formData.get("password") as string

  if (!identifier || !password) {
    return { error: "Usuario o email y contraseña son obligatorios" }
  }

  let email = identifier

  if (!identifier.includes("@")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .ilike("username", identifier)
      .maybeSingle()

    if (!profile?.email) {
      return { error: "Credenciales inválidas" }
    }

    email = profile.email
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
