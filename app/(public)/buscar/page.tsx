import Link from "next/link"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { searchAll } from "@/lib/actions/search"
import { getGameList, getTags, resolveTagSlug } from "@/lib/queries/games"
import { slugifyTagName } from "@/lib/tag-utils"
import { GameCard } from "@/components/GameCard"
import { SortSelect } from "@/components/SortSelect"
import { TagFilter } from "@/components/CategoryFilter"
import { NumericPagination } from "@/components/NumericPagination"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { GameWithDetails, Tag } from "@/lib/definitions"

/* ── Shared types ─────────────────────────────────────────── */

interface SearchPageProps {
  searchParams: Promise<{ q?: string; sort?: string; tag?: string; page?: string }>
}

/* ── Browse mode (full game listing) ──────────────────────── */

const SORT_TITLES: Record<string, string> = {
  rated: "Mejor valorados",
  popular: "Más jugados",
  recent: "Novedades",
}

async function BrowseGameList({
  sort,
  tag,
  page: pageStr,
}: {
  sort?: string
  tag?: string
  page?: string
}) {
  let tagIds: string[] | undefined
  if (tag) {
    const resolvedId = await resolveTagSlug(tag)
    if (resolvedId) tagIds = [resolvedId]
  }

  const page = parseInt(pageStr ?? "0", 10)
  const effectiveSort = (sort as "recent" | "popular" | "rated") ?? "recent"

  const { games, total } = await getGameList({
    sort: effectiveSort,
    tagIds,
    page,
    limit: 12,
  })

  const totalPages = Math.ceil(total / 12)
  const safePage = Math.min(page, Math.max(0, totalPages - 1))

  return (
    <div className="space-y-6">
      {games.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No hay juegos aún</p>
          <p className="text-sm">¡Sé el primero en publicar uno!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game as unknown as GameWithDetails} />
            ))}
          </div>

          <NumericPagination
            currentPage={safePage}
            totalPages={totalPages}
            basePath="/buscar"
            searchParams={{ sort, tag }}
          />
        </>
      )}
    </div>
  )
}

async function TagFilterWrapper() {
  const tags = await getTags()
  return <TagFilter tags={tags} />
}

/* ── Search mode (text search) ────────────────────────────── */

function UserCard({
  user,
}: {
  user: { id: string; username: string | null; avatar_url: string | null }
}) {
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
      <span className="truncate text-sm font-medium">{user.username ?? "Sin nombre"}</span>
    </Link>
  )
}

function TagCard({ tag }: { tag: Tag }) {
  return (
    <Link
      href={`/buscar?tag=${slugifyTagName(tag.name)}`}
      className="inline-block rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
    >
      {tag.name}
    </Link>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const { q, sort, tag, page } = params
  const isBrowse = !q

  /* ── Browse mode ────────────────────────────────────────── */
  if (isBrowse) {
    const title = SORT_TITLES[sort ?? ""] ?? "Explorar juegos"

    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-semibold text-arcade-dark">{title}</h1>
          <div className="flex items-center gap-3">
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<div className="h-8 animate-pulse rounded-[10px] bg-muted" />}>
          <TagFilterWrapper />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded-[10px] bg-muted" />
          }
        >
          <BrowseGameList sort={sort} tag={tag} page={page} />
        </Suspense>
      </div>
    )
  }

  /* ── Empty state ────────────────────────────────────────── */
  if (!q || !q.trim()) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-arcade-dark">Buscar</h1>
        <p className="text-muted-foreground">
          Usá el buscador del header para encontrar juegos, usuarios o categorías.
        </p>
      </div>
    )
  }

  /* ── Search mode ────────────────────────────────────────── */
  const query = q.trim()
  const { games, users, tags } = await searchAll(query)
  const totalResults = games.length + users.length + tags.length

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-arcade-dark">
          Resultados para: <span className="text-arcade-red">&ldquo;{query}&rdquo;</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalResults} resultado{totalResults !== 1 ? "s" : ""} encontrado
          {totalResults !== 1 ? "s" : ""}
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No se encontraron resultados</p>
          <p className="mt-1 text-sm">Probá con otros términos de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Games section */}
          {games.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-arcade-dark">
                Juegos
                <span className="text-sm font-normal text-muted-foreground">
                  ({games.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {(games as unknown as GameWithDetails[])
                  .slice(0, 6)
                  .map((game) => (
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
              <h2 className="flex items-center gap-2 text-lg font-semibold text-arcade-dark">
                Usuarios
                <span className="text-sm font-normal text-muted-foreground">
                  ({users.length})
                </span>
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
              <h2 className="flex items-center gap-2 text-lg font-semibold text-arcade-dark">
                Categorías
                <span className="text-sm font-normal text-muted-foreground">
                  ({tags.length})
                </span>
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
