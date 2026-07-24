import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { searchAll } from "@/lib/actions/search"
import { GameCard } from "@/components/GameCard"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { GameWithDetails, Tag } from "@/lib/definitions"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

function UserCard({ user }: { user: { id: string; username: string | null; avatar_url: string | null } }) {
  return (
    <Link
      href={user.username ? `/perfil/${user.username}` : "#"}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
    >
      <Avatar className="h-10 w-10">
        {user.avatar_url ? (
          <AvatarImage src={user.avatar_url} alt={user.username ?? ""} />
        ) : (
          <AvatarFallback className="text-sm font-bold">
            {(user.username ?? "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="text-sm font-medium truncate">
        {user.username ?? "Sin nombre"}
      </span>
    </Link>
  )
}

function TagCard({ tag }: { tag: Tag }) {
  return (
    <Link
      href={`/?tag=${tag.id}`}
      className="inline-block rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
    >
      {tag.name}
    </Link>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams

  if (!q || !q.trim()) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-arcade-dark mb-2">Buscar</h1>
        <p className="text-muted-foreground">
          Usá el buscador del header para encontrar juegos, usuarios o categorías.
        </p>
      </div>
    )
  }

  const query = q.trim()
  const { games, users, tags } = await searchAll(query)
  const totalResults = games.length + users.length + tags.length

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-arcade-dark">
          Resultados para: <span className="text-arcade-red">&ldquo;{query}&rdquo;</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalResults} resultado{totalResults !== 1 ? "s" : ""} encontrado{totalResults !== 1 ? "s" : ""}
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No se encontraron resultados</p>
          <p className="text-sm mt-1">Probá con otros términos de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Games section */}
          {games.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-arcade-dark flex items-center gap-2">
                Juegos
                <span className="text-sm font-normal text-muted-foreground">({games.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {(games as unknown as GameWithDetails[]).slice(0, 6).map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
              {games.length > 6 && (
                <Link
                  href={`/?q=${encodeURIComponent(query)}`}
                  className="block text-sm text-arcade-red hover:underline"
                >
                  Ver todos los juegos &rarr;
                </Link>
              )}
            </section>
          )}

          {/* Users section */}
          {users.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-arcade-dark flex items-center gap-2">
                Usuarios
                <span className="text-sm font-normal text-muted-foreground">({users.length})</span>
              </h2>
              <div className="space-y-2">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </section>
          )}

          {/* Tags section */}
          {tags.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-arcade-dark flex items-center gap-2">
                Categorías
                <span className="text-sm font-normal text-muted-foreground">({tags.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagCard key={tag.id} tag={tag} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
