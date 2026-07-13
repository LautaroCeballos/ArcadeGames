import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getGames } from "@/lib/actions/games"
import { GameGridSkeleton } from "@/components/GameGrid"
import { LoadMoreGames } from "@/components/LoadMoreGames"
import { SearchBar } from "@/components/SearchBar"
import { CategoryFilter } from "@/components/CategoryFilter"
import type { Category } from "@/lib/definitions"

interface HomeProps {
  searchParams: Promise<{ q?: string; category?: string }>
}

async function GameList({ searchParams }: { searchParams: Awaited<HomeProps["searchParams"]> }) {
  const { games, total } = await getGames({
    search: searchParams.q,
    categoryId: searchParams.category,
    page: 0,
  })

  if (total === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No hay juegos aún</p>
        <p className="text-sm">¡Sé el primero en publicar uno!</p>
      </div>
    )
  }

  return (
    <LoadMoreGames
      initialGames={games}
      total={total}
      search={searchParams.q}
      categoryId={searchParams.category}
    />
  )
}

async function CategoryList() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from("categories").select("*")
  return <CategoryFilter categories={(categories ?? []) as Category[]} />
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Juegos</h1>
          <p className="text-sm text-muted-foreground">
            Explorá juegos creados con MakeCode Arcade
          </p>
        </div>
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-8" />}>
        <CategoryList />
      </Suspense>

      <Suspense fallback={<GameGridSkeleton />}>
        <GameList searchParams={params} />
      </Suspense>
    </div>
  )
}
