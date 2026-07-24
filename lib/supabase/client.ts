import { createBrowserClient } from "@supabase/ssr"

// createBrowserClient ya es singleton por defecto (isSingleton: true en @supabase/ssr).
// Cada llamada desde browser devuelve la misma instancia.
// Este wrapper existe solo por claridad y consistencia con server.ts.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
