import Link from "next/link"

const footerLinks = {
  left: [
    { label: "MakeCode Arcade", href: "https://arcade.makecode.com" },
    { label: "Agregar juegos", href: "/subir" },
    { label: "Categorías", href: "/" },
  ],
  right: [
    { label: "Iniciar Sesión", href: "/login" },
    { label: "Sobre ArcadePlay", href: "/" },
    { label: "Términos y Condiciones", href: "/" },
  ],
} as const

export function Footer() {
  return (
    <footer className="bg-arcade-red">
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-arcade-beige"
          >
            ArcadePlay
          </Link>
        </div>

        {/* Link columns */}
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-16">
          <nav className="flex flex-col items-center gap-3 sm:items-start" aria-label="Enlaces del footer">
            {footerLinks.left.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-arcade-beige/80 transition-colors hover:text-arcade-beige"
                {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col items-center gap-3 sm:items-start" aria-label="Enlaces adicionales">
            {footerLinks.right.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-arcade-beige/80 transition-colors hover:text-arcade-beige"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
