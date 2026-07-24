"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// ─── Constants ───────────────────────────────────────────────

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/
const PASSWORD_MIN_LENGTH = 8
const CURRENT_YEAR = new Date().getFullYear()
const MIN_BIRTH_YEAR = 1900

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
    return { error: error.message }
  }

  // ── Success — user needs to verify email ────────────────
  return { success: true }
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
