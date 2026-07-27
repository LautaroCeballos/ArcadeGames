import Link from "next/link"
import { Suspense } from "react"
import { HeroSlider } from "@/components/HeroSlider"
import { FeaturedSection, FeaturedSectionSkeleton } from "@/components/FeaturedSection"
import { CategoryRecentSection, CategoryRecentSectionSkeleton } from "@/components/CategoryRecentSection"
import { RankingSection } from "@/components/RankingSection"
import { GameGridSkeleton } from "@/components/GameGrid"
import { Skeleton } from "@/components/ui/skeleton"
import { getActiveBannerSlides } from "@/lib/actions/banner"
import { getPlayerLeaderboard } from "@/lib/actions/ranking"
import { getFeaturedGames, getRecentGames, getGameList, getAllTags } from "@/lib/queries/games"
import { GameCard } from "@/components/GameCard"

/* ── Hero Slider wrapper ─────────────────────────────────── */

async function HeroSliderWrapper() {
  const slides = await getActiveBannerSlides()

  const mappedSlides = slides.length > 0
    ? slides.map((s) => ({
        id: s.id,
        imageUrl: s.image_url ?? "",
        title: s.title,
        description: s.description ?? "",
        ctaText: s.cta_text,
        ctaLink: s.cta_link,
        template: s.template || "bar-right",
      }))
    : undefined

  return <HeroSlider slides={mappedSlides} />
}

/* ── Featured games section ──────────────────────────────── */

async function FeaturedSectionWrapper() {
  const games = await getFeaturedGames(4)
  return <FeaturedSection games={games} />
}

/* ── Category + Recent 2-column section ──────────────────── */

async function CategoryRecentWrapper() {
  const [tags, recentGames] = await Promise.all([
    getAllTags(),
    getRecentGames(5),
  ])

  // Ensure platform tags come first, sorted by name
  const platformPriority = ["MakeCode Arcade", "Scratch"]
  const sorted = [...tags].sort((a, b) => {
    const ia = platformPriority.indexOf(a.name)
    const ib = platformPriority.indexOf(b.name)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.name.localeCompare(b.name)
  })

  return <CategoryRecentSection tags={sorted} recentGames={recentGames} />
}

/* ── Ranking section ─────────────────────────────────────── */

function RankingSectionSkeleton() {
  return (
    <section className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-[10px]" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-[10px]" />
        ))}
      </div>
    </section>
  )
}

async function RankingSectionWrapper() {
  const players = await getPlayerLeaderboard(50)
  return <RankingSection players={players} />
}

/* ── All games listing (preview) ──────────────────────────── */

async function GameListSection() {
  const { games } = await getGameList({ limit: 8 })

  return (
    <div className="space-y-6">
      {games.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No hay juegos aún</p>
          <p className="text-sm">¡Sé el primero en publicar uno!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────── */

interface HomeProps {
  searchParams: Promise<{ q?: string; tag?: string; sort?: string; page?: string }>
}

export default async function HomePage(_props: HomeProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-6">
      {/* 1. Hero Slider */}
      <Suspense fallback={<div className="h-[250px] animate-pulse rounded-[10px] bg-muted sm:h-[320px] md:h-[360px] lg:h-[400px]" />}>
        <HeroSliderWrapper />
      </Suspense>

      {/* 2. Featured Games (4-card grid) */}
      <Suspense fallback={<FeaturedSectionSkeleton />}>
        <FeaturedSectionWrapper />
      </Suspense>

      {/* 3. Two-column: Categories | Recent Projects */}
      <Suspense fallback={<CategoryRecentSectionSkeleton />}>
        <CategoryRecentWrapper />
      </Suspense>

      {/* 4. Ranking */}
      <Suspense fallback={<RankingSectionSkeleton />}>
        <RankingSectionWrapper />
      </Suspense>

      {/* 5. All games listing (preview + Ver Más) */}
      <section className="scroll-mt-20 space-y-4" id="todos-los-juegos">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-[25px] font-semibold text-arcade-dark">
            Todos los juegos
          </h2>
          <Link
            href="/buscar?sort=recent"
            className="group flex items-center gap-1 text-sm font-medium text-arcade-dark/60 transition-colors hover:text-arcade-red"
          >
            Ver Más
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        <Suspense fallback={<GameGridSkeleton />}>
          <GameListSection />
        </Suspense>
      </section>
    </div>
  )
}
