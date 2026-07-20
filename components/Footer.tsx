import Link from "next/link"

const links = [
  { label: "MakeCode Arcade", href: "https://arcade.makecode.com" },
  { label: "Subir juego", href: "/subir" },
  { label: "Iniciar sesión", href: "/login" },
  { label: "Términos", href: "/" },
] as const

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-between">
        <Link
          href="/"
          className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
        >
          ArcadePlay
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1" aria-label="Footer">
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
        </nav>
      </div>
    </footer>
  )
}
