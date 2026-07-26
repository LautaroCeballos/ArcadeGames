# Plan: Rediseño de Secciones del Home

Fecha: 2026-07-25
Tags: [frontend, home, redesign]

## Objetivo

Reemplazar las 3 secciones curadas actuales del home ("Últimos Juegos", "Más Jugados", "Mejor Valorados") por nuevas secciones basadas en el diseño Figma, mejorando la jerarquía visual y la experiencia de descubrimiento.

## Layout final del home

```
┌──────────────────────────────────┐
│          HeroSlider              │  ← sin cambios
├──────────────────────────────────┤
│       Juegos Destacados          │  ← 4 cards en grid CSS
├─────────────────┬────────────────┤
│  Explorar por   │   Novedades    │  ← 2 columnas lg:grid-cols-2
│  Categoría      │   (3 mini)     │
├─────────────────┴────────────────┤
│        RankingSection            │  ← sin cambios
├──────────────────────────────────┤
│       Todos los juegos           │  ← mejorado: sort, paginación numérica
└──────────────────────────────────┘
```

## Mantener sin cambios

- Navbar / NavbarClient
- HeroSlider
- RankingSection + PodiumCard
- Footer
- GameCard, GameGrid
- TagFilter

## Archivos nuevos

| Archivo | Tipo | Descripción |
|---|---|---|
| `lib/queries/games.ts` | Server | Queries de lectura separadas de mutations (sin `"use server"`) |
| `lib/tag-icons.ts` | Shared | Mapping tag name → LucideIcon con fallback |
| `components/FeaturedSection.tsx` | Server | Sección de juegos destacados + FeaturedCard inline |
| `components/RecentProjectsSection.tsx` | Server | Sección de novedades + RecentProjectCard inline |
| `components/CategoryExplorer.tsx` | Server | Sección explorar categorías + CategoryCard inline |
| `components/SortSelect.tsx` | Client | Dropdown de ordenamiento (`?sort=`) |
| `components/NumericPagination.tsx` | Server | Links de paginación numérica (`?page=N`) |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/(public)/page.tsx` | Nuevo layout con 5 Suspense boundaries |
| `lib/actions/games.ts` | Agregar `getFeaturedGames()` + author/platform a `getRecentGames()` y `getMostPlayed()` |
| `lib/definitions.ts` | Agregar tipos `FeaturedGameData`, `RecentGameData` |

## Decisiones de implementación

| Decisión | Opción |
|---|---|
| Featured layout | CSS Grid `grid-cols-2 lg:grid-cols-4` |
| Category click | Navegar a `/?tag=X` (consistente con TagFilter) |
| "Ver todos" → | Anchor `#todos-los-juegos` con `scroll-behavior: smooth` |
| Border radius | `rounded-[10px]` en todas las cards (consistente) |
| Featured fallback | Más vistos si no hay suficientes estrellas |
| Tag→icon fallback | `Gamepad2` si el tag no está en mapping |
| Paginación | Server component con `<Link>` puros (0 JS) |
| Suspense boundaries | Individuales por sección |
| Data fetching | Queries en paralelo vía `Promise.all` |

## Orden de implementación

| # | Qué | Dependencias |
|---|---|---|
| 1 | `lib/tag-icons.ts` + `lib/queries/games.ts` | Ninguna |
| 2 | `NumericPagination.tsx` + `SortSelect.tsx` | queries/games |
| 3 | `FeaturedSection.tsx` + `FeaturedCard.tsx` | queries/games |
| 4 | `RecentProjectsSection.tsx` + `RecentProjectCard.tsx` | queries/games |
| 5 | `CategoryExplorer.tsx` + `CategoryCard.tsx` | tag-icons |
| 6 | `app/(public)/page.tsx` + server actions | Todo lo anterior |

## Queries

```typescript
interface FeaturedGameData {
  id: string
  title: string
  thumbnail_url: string | null
  author: string | null
  stars_count: number | null
}

interface RecentGameData {
  id: string
  title: string
  thumbnail_url: string | null
  author: string | null
  stars_count: number | null
  platform: 'makecode' | 'scratch'
}

// getFeaturedGames(limit = 4): top por estrellas, fallback a más vistos
// getRecentGames(limit = 3): últimos aprobados con author + platform
// getGames({ search?, tagIds?, sort?, page?, limit? }): sort: "recent"|"popular"|"rated"
// getTags(minusPlatforms = true): tags desde DB
```

## Estados por sección

| Sección | Loading | Vacío | Error |
|---|---|---|---|
| Featured | 4 skeletons aspect-video | Ocultar | Ocultar |
| Categories | 6 skeletons compactos | Ocultar | Ocultar |
| Novedades | 3 skeletons mini | Ocultar | Ocultar |
| Ranking | RankingSectionSkeleton (existente) | Mostrar empty | Ocultar |
| Todos juegos | GameGridSkeleton (existente) | "No hay juegos aún" | error.tsx padre |

## Responsive

| Breakpoint | Featured | Cat\|Novedades | Game grid |
|---|---|---|---|
| ≥1024px | 4 cols | 2 cols side-by-side | 4 cols |
| 768-1023px | 3 cols | stacked | 3 cols |
| <768px | 2 cols | stacked (cats scroll hz) | 2 cols |
