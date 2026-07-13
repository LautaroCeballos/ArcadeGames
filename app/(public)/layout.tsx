import { Navbar } from "@/components/Navbar"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>ArcadePlay — Juegos MakeCode Arcade</p>
      </footer>
    </>
  )
}
