---
title: "ArcadePlay — Estado del Proyecto"
tags: [state, checkpoint]
last_updated: "2026-07-14"
sources:
  - package.json
  - next.config.ts
---

# ArcadePlay — Estado del Proyecto

Checkpoint de implementación al 14/07/2026. Este documento captura el estado completo del proyecto para evitar pérdida de contexto.

---

## Stack implementado

| Capa | Detalle |
|------|---------|
| Framework | Next.js 16.2.10 (App Router) |
| React | 19.2.4 |
| Estilos | Tailwind CSS v4 + shadcn/ui (new-york) |
| Backend | Supabase (Postgres + Auth) |
| PM | pnpm 9.15.9 |
| Lenguaje | TypeScript 5.9 (strict) |

### Dependencias principales instaladas
- `@supabase/supabase-js` 2.110.3
- `@supabase/ssr` 0.12.1
- `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`
- Radix UI: `slot`, `toast`, `select`, `avatar`, `dialog`, `label`, `separator`

---

## Estructura del proyecto

### `/app/` — Rutas y layouts
```
app/
  layout.tsx              ← Root layout (fonts, metadata, Toaster)
  globals.css             ← Tailwind v4 + CSS variables shadcn
  not-found.tsx           ← Página 404
  error.tsx               ← Error boundary global

  (public)/
    layout.tsx            ← Navbar + footer
    page.tsx              ← Home (búsqueda + categorías + grid)
    juego/[id]/page.tsx   ← Detalle del juego (GameTabs con Juego/Editor + rating)
    perfil/[username]/    ← Perfil de usuario (header + stats + tabs juegos/logros + gestión)
    login/page.tsx        ← Login form
    signup/page.tsx       ← Signup form

  (protected)/
    layout.tsx            ← Navbar + footer (igual que public)
    subir/page.tsx        ← Formulario de publicación
    dashboard/page.tsx    ← Redirige a `/perfil/{username}`
    editar/[id]/page.tsx  ← Editar juego
```

### `/components/` — Componentes
| Archivo | Tipo | Props clave |
|---------|------|-------------|
| `Navbar.tsx` | Server | Fetches user, renders `<NavbarClient>` |
| `NavbarClient.tsx` | Client | `{ user }` — menú hamburguesa, scroll shadow, íconos |
| `Footer.tsx` | Server | Links estáticos, fondo arcade-red |
| `HeroSlider.tsx` | Client | `slides[]` — auto-play 5s, dots, pausa en hover |
| `CuratedSection.tsx` | Server | `{ title, games[] }` — scroll horizontal snap |
| `GameThumbnail.tsx` | Server | `{ game }` — overlay oscuro + rating |
| `GameCard.tsx` | Server | `game: GameWithDetails` — estilo thumbnail |
| `GameGrid.tsx` | Server | `games: GameWithDetails[]` + Skeleton |
| `LoadMoreGames.tsx` | Client | Paginación "Cargar más" con server action |
| `ArcadeEmbed.tsx` | Client | `url, title, sandbox?` — iframe 4:3 con loading/fallback |
| `GameTabs.tsx` | Client | `gameId, title` — tabs Juego (default) + Editor debajo del embed |
| `GameActions.tsx` | Client | `gameId, hidden` — ocultar/eliminar |
| `RankingSection.tsx` | Server | Rankings mock — 2 layouts: simple (3 entries) y doble (6 entries en 2 columnas) |
| `PodiumCard.tsx` | Server | Top 3 global con trofeos oro/plata/bronce, mismo formato visual que RankingCard |
| `Rating.tsx` | Client | `gameId, avgRating, userRating` |
| `SearchBar.tsx` | Client | Debounce 300ms, URL search params |
| `CategoryFilter.tsx` | Client | Pills de categorías, URL params |
| `SubmitGameForm.tsx` | Client | `categories`, action `createGame` |
| `ThumbnailPicker.tsx` | Client | `shortId, embedUrl, onThumbnailChange` — auto MakeCode + upload |
| `DashboardCard.tsx` | Client | `{ game }` — card horizontal con thumbnail, status, stats, acciones |
| `EditGameForm.tsx` | Client | `{ game, categories }` — formulario pre-cargado para editar |
| `ProfileHeader.tsx` | Server | `{ profile, isOwnProfile, isFollowing }` — avatar, username, bio, website, stats bar (estrellas, juegos, seguidores, siguiendo), follow button |
| `ProfileBadges.tsx` | Server | `{ badges[] }` — grid de emblemas ganados con tooltip hover |
| `ProfileGameCard.tsx` | Server | `{ game, isOwner }` — card de juego con thumbnail, status badge, stats, acciones (editar, ocultar, eliminar si es dueño) |
| `ProfileTabs.tsx` | Client | `{ games[], badges[], isOwner }` — tabs Juegos + Logros (si tiene badges) |
| `FollowButton.tsx` | Client | `{ targetUserId, isFollowing }` — botón seguir/dejar de seguir con useActionState |
| `GameActionsInline.tsx` | Client | `ToggleVisibilityButton`, `DeleteGameButton` — wrappers useActionState para acciones inline |
| `AuthButton.tsx` | Server | Form action `signOut` |
| `LoginForm.tsx` | Client | `useActionState(signIn)` |
| `SignUpForm.tsx` | Client | `useActionState(signUp)` |
| `ui/*.tsx` | — | button, card, input, toast, badge, etc. |

### `/lib/` — Lógica
| Archivo | Propósito |
|---------|-----------|
| `supabase/client.ts` | Browser client (createBrowserClient) |
| `supabase/server.ts` | Server client (cookies, RSC) |
| `supabase/middleware.ts` | Session refresh middleware (usado por proxy.ts) |
| `actions/auth.ts` | signIn, signUp, signOut (useActionState signature) |
| `actions/games.ts` | createGame, updateGame, toggleVisibility, deleteGame, getGames, getGameById, getUserGames, getMyGames, getRecentGames, getMostPlayed, getTopRated |
| `actions/ratings.ts` | rateGame (upsert — awards badges to rater + game owner) |
| `actions/thumbnails.ts` | uploadThumbnail |
| `actions/profile.ts` | getProfileByUsername, updateMyProfile |
| `actions/social.ts` | followUser, unfollowUser, isFollowing, getFollowers, getFollowing |
| `actions/badges.ts` | checkAndAwardBadges, getAllBadges |
| `definitions.ts` | Tipos Database, Game, Profile, Category, Tag, Rating, GameWithDetails |
| `game-utils.ts` | extractGameId, extractScratchId, buildEmbedUrl, buildScratchEmbedUrl, isValidMakeCodeUrl, isValidScratchUrl, extractGamePlatform, fetchProjectThumbnailUrl |
| `utils.ts` | cn() con clsx + tailwind-merge |

### `/hooks/`
| Archivo | Propósito |
|---------|-----------|
| `use-debounce.ts` | Debounce genérico |
| `use-toast.ts` | Estado global de toasts |

### `/supabase/migrations/`
| Archivo | Propósito |
|---------|-----------|
| `00001_initial_schema.sql` | Creación de tablas + RLS + seed |

---

## Base de datos (ejecutada ✅)

Migración `supabase/migrations/00001_initial_schema.sql` ejecutada vía MCP Supabase:

| Tabla | Filas | RLS |
|-------|-------|-----|
| `profiles` | 0 (se crean al registrarse) | ✅ |
| `categories` | 10 (seed: Acción, Aventura, Puzzle...) | ✅ |
| `games` | 0 | ✅ |
| `tags` | 0 | ✅ |
| `game_tags` | 0 | ✅ |
| `ratings` | 0 | ✅ |
| `badges` | 8 (seed) | ✅ |
| `user_badges` | 0 | ✅ |
| `follows` | 0 | ✅ |

Contenido:
- 9 tablas, RLS policies completas
- Trigger `handle_new_user` para crear perfil automático
- 10 categorías seeded
- 8 badges automáticos seeded (Primer Juego, Cinco Juegos, Diez Juegos, Primera Estrella, 50 Estrellas, 100 Estrellas, 1000 Vistas, Explorador)
- Funciones `award_badge()` y `recalc_owner_stars()`
- Índices incluyendo pg_trgm para búsqueda

---

## Variables de entorno

Archivo `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL=https://gbuayimtfyvbeqkcvfff.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

---

## Autenticación

- **Método**: Email/password via Supabase Auth
- **Registro**: Formulario en `/signup` → `supabase.auth.signUp()` → trigger crea perfil
- **Login**: Formulario en `/login` → `supabase.auth.signInWithPassword()` → redirect a `/dashboard`
- **Logout**: Botón en Navbar → `supabase.auth.signOut()` → redirect a `/`
- **Proxy**: `proxy.ts` (renombrado de `middleware.ts`, Next.js 16) refresca sesión via `@supabase/ssr`

> [!note] Las rutas protegidas (`/subir`, `/dashboard`) verifican sesión dentro de la page y redirigen a `/login` si no hay sesión. No hay middleware de protección de rutas (se hace en cada page).

---

## Features implementadas

### Publicación de juegos ✅
- Formulario en `/subir` con toggle de plataforma (MakeCode Arcade o Scratch)
- MakeCode: 3 formatos de URL aceptados, preview con `ArcadeEmbed`
- Scratch: URL `scratch.mit.edu/projects/{id}`, preview con `ScratchEmbed`
- Validación según plataforma, IDs únicos con prefijo `scratch_` para Scratch
- Thumbnail: MakeCode → auto (API) + upload; Scratch → solo upload
- Campos: título, descripción, categoría (compartidos)
- Status inicial: `approved` (auto-approve)
- Accesibilidad: `fieldset`/`legend`, `aria-*`, `role="alert"`, validación inline

### Búsqueda ✅
- SearchBar con debounce 300ms
- Filtro por URL params (`?q=`)
- ILIKE en `games.title`

### Filtro por categorías ✅
- CategoryFilter con pills
- URL params (`?category=`)
- Botón "Todas" para reset

### Rating ✅
- 5 estrellas interactivas
- Upsert (UNIQUE game_id, user_id)
- Promedio dinámico
- Requiere autenticación

### Dashboard ✅
- Stats bar: total, publicados, pendientes, vistas acumuladas
- DashboardCards: thumbnail, status badge (color-coded), métricas, acciones
- Acciones por juego: Jugar, Editar, Ocultar/Mostrar, Eliminar
- Empty state con ilustración y CTA

### Perfil público ✅
- Header con avatar, username, bio, website
- Stats bar: estrellas totales, cantidad de juegos, seguidores, siguiendo
- Tabs: Juegos (grid con management si es dueño) y Logros (badges)
- Botón Seguir/Siguiendo si no es tu perfil
- Dashboard (`/dashboard`) redirige a `/perfil/{username}`

### Badges/Logros ✅
- 8 badges automáticos seedeados (Primer Juego, Cinco Juegos, Diez Juegos, Primera Estrella, 50 Estrellas, 100 Estrellas, 1000 Vistas, Explorador)
- Asignación automática al crear juego o votar
- Grid de badges en tab Logros del perfil
- Función `award_badge()` en PostgreSQL

### Social (Follows) ✅
- Tabla `follows` con PK (follower_id, following_id) y CHECK no self-follow
- Server actions: followUser, unfollowUser, isFollowing, getFollowers, getFollowing
- Botón Seguir/Siguiendo en perfil con toggle
- RLS: solo el propio follower puede insertar/eliminar

### Edición de juegos ✅
- Ruta `/editar/[id]` con formulario pre-cargado
- Campos editables: título, descripción, categoría, miniatura
- Server action `updateGame` con verificación de ownership
- ThumbnailPicker integrado

### Miniatura de juegos ✅
- Auto-thumbnail desde API de MakeCode (vía `fetchProjectThumbnailUrl`)
- Subida manual de imagen a Supabase Storage (bucket `game-thumbnails`)
- Grid de thumbnails seleccionables
- Sin `getDisplayMedia` (rechazado por restricción cross-origin)

### Embebido de juegos ✅
- ArcadeEmbed: iframe 4:3 con loading spinner + sandbox opcional (para MakeCode)
- ScratchEmbed: iframe con `allowtransparency`, aspect ratio 6:5 (para Scratch)
- GameTabs adaptativos: MakeCode → tabs Juego + Editor; Scratch → solo Juego
- Fallback si el iframe falla

---

## Diseño Figma

El diseño visual completo está definido en el archivo de Figma `ArcadePlay` (file key: `PaIO3mFRsd5QQ2NA2GsxtT`).

| Aspecto | Estado |
|---------|--------|
| Design tokens | ✅ Aplicados en `globals.css` |
| Navbar roja | ✅ Implementada con íconos lucide-react + menú mobile |
| Hero Slider | ✅ Auto-play 5s, dots, mock data |
| Secciones curadas | ✅ Últimos Juegos, Más Jugados, Mejor Valorados |
| Game Thumbnails con overlay | ✅ Overlay oscuro + rating + hover scale |
| Ranking + Podio | ✅ Mock data para Ayer, Semana, Mes, Año |
| Footer rojo | ✅ 2 columnas de links en beige |
| Página de juego adaptada | ✅ Badges rojos, colores arcade |

Ver [[frontend/design-tokens]] para paleta y sistema visual.
Ver el plan completo en `docs/raw/plans/2026-07-13-figma-adaptation.md`.

## Pendiente (próximos pasos)

1. 🟡 Confirmar que el trigger de perfil funciona (auto-create en signup)
2. 🔵 Implementar formulario dual (MakeCode + Scratch) — plan en `docs/raw/plans/2026-07-20-submit-form-dual-platform.md`
3. 🔵 Reemplazar datos mock del ranking con queries reales de ratings
4. 🔵 Conectar HeroSlider a CMS o datos dinámicos
5. 🔵 Tags en formulario de subida
6. 🔵 Contador de vistas (increment en cada visita)
7. 🔵 Modo oscuro
8. 🔵 Página 404 personalizada con search

> Leyenda: 🔴 Crítico · 🟡 Importante · 🟢 Nice-to-have · 🔵 Futuro

---

## Archivos clave referenciados

Ver [[architecture/routes]] para estructura de rutas.
Ver [[database/schema]] para esquema de tablas.
Ver [[auth/flow]] para flujo de autenticación.
Ver [[features/games]] para sistema de juegos.
Ver [[frontend/components]] para inventario de componentes.
Ver [[frontend/design-tokens]] para sistema visual.
