import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/lib/actions/auth"

const links = [
  { label: "MakeCode Arcade", href: "https://arcade.makecode.com" },
  { label: "Scratch", href: "https://scratch.mit.edu" },
  { label: "Subir juego", href: "/subir" },
  { label: "Términos", href: "/terminos" },
] as const

export async function Footer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between">
        <Link
          href="/"
          className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        >
          <img src="/logo-claro.png" alt="ArcadePlay" className="h-8 w-auto dark:hidden" />
          <img src="/logo-oscuro.png" alt="ArcadePlay" className="h-8 w-auto hidden dark:block" />
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1" aria-label="Footer">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs text-foreground/50 transition-colors hover:text-foreground"
              {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-foreground/50 transition-colors hover:text-foreground"
              >
                Cerrar sesión
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="text-xs text-foreground/50 transition-colors hover:text-foreground"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </footer>
  )
}
