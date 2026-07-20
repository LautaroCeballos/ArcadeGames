import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getGames, getRecentGames, getMostPlayed, getTopRated } from "@/lib/actions/games"
import { GameGridSkeleton } from "@/components/GameGrid"
import { LoadMoreGames } from "@/components/LoadMoreGames"
import { SearchBar } from "@/components/SearchBar"
import { TagFilter } from "@/components/CategoryFilter"
import { CuratedSection } from "@/components/CuratedSection"
import { CuratedSectionSkeleton } from "@/components/CuratedSection"
import { HeroSlider } from "@/components/HeroSlider"
import { RankingSection } from "@/components/RankingSection"
import type { Tag } from "@/lib/definitions"

async function RecentGamesSection() {
  const games = await getRecentGames(8)
  return <CuratedSection title="Últimos Juegos" games={games} />
}

async function MostPlayedSection() {
  const games = await getMostPlayed(8)
  return <CuratedSection title="Más Jugados" games={games} />
}

async function TopRatedSection() {
  const games = await getTopRated(8)
  return <CuratedSection title="Mejor Valorados" games={games} />
}

async function GameList({ searchParams }: { searchParams: Awaited<HomeProps["searchParams"]> }) {
  const tagIds = searchParams.tag ? [searchParams.tag] : undefined
  const { games, total } = await getGames({
    search: searchParams.q,
    tagIds,
    page: 0,
  })

  if (total === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
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
      tagIds={tagIds}
    />
  )
}

async function CategoryList() {
  const supabase = await createClient()
  const { data: tags } = await supabase.from("tags").select("*")
  // Exclude platform tags from filter (they show as badges on game cards)
  const displayTags = (tags ?? []).filter((t) => t.name !== 'MakeCode Arcade' && t.name !== 'Scratch')
  return <TagFilter tags={displayTags as Tag[]} />
}

/* ── Page ─────────────────────────────────────────────────── */

interface HomeProps {
  searchParams: Promise<{ q?: string; tag?: string }>
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Curated sections */}
      <Suspense fallback={<CuratedSectionSkeleton />}>
        <RecentGamesSection />
      </Suspense>

      <Suspense fallback={<CuratedSectionSkeleton />}>
        <MostPlayedSection />
      </Suspense>

      <Suspense fallback={<CuratedSectionSkeleton />}>
        <TopRatedSection />
      </Suspense>

      {/* Ranking */}
      <RankingSection />

      {/* Full game listing with search */}
      <section className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-[25px] font-semibold text-arcade-dark">
            Todos los juegos
          </h2>
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
      </section>
    </div>
  )
}
