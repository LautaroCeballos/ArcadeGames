"use client"

import Link from "next/link"
import { Search, Upload, User, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavbarClientProps {
  user: {
    id: string
    email?: string | null
  } | null
}

export function NavbarClient({ user }: NavbarClientProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-arcade-red transition-shadow duration-200",
        scrolled && "shadow-lg shadow-black/20",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-arcade-beige"
        >
          ArcadePlay
        </Link>

        {/* Desktop: icons + auth */}
        <div className="hidden items-center gap-1 sm:flex">
          {/* Search — beige rounded bg per Figma */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-arcade-beige/20 text-arcade-beige hover:bg-arcade-beige/30"
            asChild
          >
            <Link href="/">
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar juegos</span>
            </Link>
          </Button>

          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-arcade-beige hover:bg-arcade-red/80"
                asChild
              >
                <Link href="/subir">
                  <Upload className="h-5 w-5" />
                  <span className="sr-only">Subir juego</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-arcade-beige hover:bg-arcade-red/80"
                asChild
              >
                <Link href="/dashboard">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Dashboard</span>
                </Link>
              </Button>
              <form action={signOut}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-arcade-beige hover:bg-arcade-red/80"
                  type="submit"
                >
                  Cerrar sesión
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-arcade-beige hover:bg-arcade-red/80"
                asChild
              >
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button
                size="sm"
                className="bg-arcade-beige text-arcade-dark hover:bg-arcade-beige/90"
                asChild
              >
                <Link href="/signup">Registrarse</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          className="flex sm:hidden p-2 text-arcade-beige"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-arcade-beige/10 bg-arcade-red px-4 pb-4 sm:hidden">
          <nav className="flex flex-col gap-1 pt-2" role="navigation">
            <MobileNavLink href="/" label="Inicio" />
            <MobileNavLink href="/" label="Buscar" icon={<Search className="h-4 w-4" />} />

            {user ? (
              <>
                <MobileNavLink href="/subir" label="Subir juego" icon={<Upload className="h-4 w-4" />} />
                <MobileNavLink href="/dashboard" label="Dashboard" icon={<User className="h-4 w-4" />} />
                <form action={signOut} className="mt-1">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-arcade-beige transition-colors hover:bg-arcade-red/80"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <>
                <MobileNavLink href="/login" label="Iniciar sesión" />
                <MobileNavLink href="/signup" label="Registrarse" />
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function MobileNavLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-arcade-beige transition-colors hover:bg-arcade-red/80"
    >
      {icon}
      {label}
    </Link>
  )
}
