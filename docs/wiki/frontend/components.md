---
title: "ArcadePlay — Inventario de Componentes Frontend"
tags: [frontend, architecture]
last_updated: "2026-07-20"
sources:
  - docs/raw/plans/2026-07-13-figma-adaptation.md
  - docs/raw/plans/2026-07-20-submit-form-dual-platform.md
  - components/
  - app/(public)/page.tsx
---

# ArcadePlay — Inventario de Componentes Frontend

## Layout

| Componente | Archivo | Tipo | Descripción |
|-----------|---------|------|-------------|
| RootLayout | `app/layout.tsx` | Server | Metadata, fonts (Geist), Toaster |
| PublicLayout | `app/(public)/layout.tsx` | Server | Navbar + main + Footer |
| ProtectedLayout | `app/(protected)/layout.tsx` | Server | Verifica sesión, navbar + footer |

## Componentes de página

| Ruta | Archivo | Componentes que usa |
|------|---------|-------------------|
| `/` | `app/(public)/page.tsx` | HeroSlider, CuratedSection (×3), RankingSection |
| `/juego/[id]` | `app/(public)/juego/[id]/page.tsx` | GameTabs, Rating, Badge |
| `/perfil/[username]` | `app/(public)/perfil/[username]/page.tsx` | ProfileHeader, ProfileTabs, ProfileGameCard, ProfileBadges |
| `/login` | `app/(public)/login/page.tsx` | LoginForm |
| `/signup` | `app/(public)/signup/page.tsx` | SignUpForm |
| `/subir` | `app/(protected)/subir/page.tsx` | SubmitGameForm |
| `/dashboard` | `app/(protected)/dashboard/page.tsx` | DashboardCard, stats summary |
| `/editar/[id]` | `app/(protected)/editar/[id]/page.tsx` | EditGameForm |

## Componentes compartidos

### Navegación

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| Navbar | `components/Navbar.tsx` | Server | Fetches `user`, renderiza `NavbarClient` |
| NavbarClient | `components/NavbarClient.tsx` | Client | `{ user }` — scroll shadow, menú hamburguesa, íconos lucide-react |
| AuthButton | `components/AuthButton.tsx` | Client | Form action `signOut` |
| Footer | `components/Footer.tsx` | Server | Links estáticos en 2 columnas (makecode, subir, categorías, login, sobre, términos) |

> [!note] Navbar: fondo `arcade-red`, texto `arcade-beige`. Search icon con bg beige redondeado. Mobile: hamburger toggles menú vertical con links. Desktop: íconos + auth buttons. [[design-tokens]]

### Juegos

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| HeroSlider | `components/HeroSlider.tsx` | Client | `slides[]` — useState + useEffect para auto-play 5s |
| CuratedSection | `components/CuratedSection.tsx` | Server | `{ title, games[] }` — overflow-x scroll con snap |
| CuratedSectionSkeleton | `components/CuratedSection.tsx` | Server | 4 placeholders animados |
| GameThumbnail | `components/GameThumbnail.tsx` | Server | `{ game: GameThumbnailData }` — overlay oscuro + rating |
| GameCard | `components/GameCard.tsx` | Server | `game: GameWithDetails` — estilo thumbnail con badge categoría |
| GameGrid | `components/GameGrid.tsx` | Server | `games[]` — grid responsive 2-5 columnas |
| LoadMoreGames | `components/LoadMoreGames.tsx` | Client | Paginación "Cargar más" vía server action |
| ArcadeEmbed | `components/ArcadeEmbed.tsx` | Client | `url, title, sandbox?` — iframe 4:3 con loading/error state. Soporta `sandbox` opcional para restringir permisos del embed |
| ScratchEmbed | `components/ScratchEmbed.tsx` | Client | `url, title` — iframe con `allowtransparency`, aspect ratio 6:5, loading/error state. Sin sandbox (no necesario para Scratch) |
| GameTabs | `components/GameTabs.tsx` | Client | `gameId, title, platform, embedUrl?` — tabs adaptativos. MakeCode: Juego + Editor. Scratch: solo Juego (embed directo) |
| RankingSection | `components/RankingSection.tsx` | Server | 4 períodos (Ayer, Semana, Mes, Año) — 2 layouts: simple (3 entries) y doble (6 entries en 2 columnas). Mock data reemplazable |
| PodiumCard | `components/PodiumCard.tsx` | Server | Top 3 global con trofeos oro/plata/bronce, mismo formato visual que RankingCard |
| SubmitGameForm | `components/SubmitGameForm.tsx` | Client | `categories[]` — formulario con toggle de plataforma (MakeCode/Scratch). URL input con validación según plataforma, preview embed, ThumbnailPicker, campos compartidos (título, descripción, categoría). Server action `createGame` con `platform` |
| ThumbnailPicker | `components/ThumbnailPicker.tsx` | Client | `shortId, embedUrl, onThumbnailChange, platform?` — 2 fuentes: auto MakeCode (vía API), subida manual. Para Scratch solo subida manual |
| DashboardCard | `components/DashboardCard.tsx` | Client | `{ game: GameWithDetails }` — card horizontal con thumbnail, status badge, stats (vistas, rating, fecha), acciones (jugar, editar, ocultar, eliminar). Colores según estado: verde=publicado, ámbar=pendiente, gris=oculto, rojo=rechazado |
| EditGameForm | `components/EditGameForm.tsx` | Client | `{ game, categories[] }` — formulario pre-cargado con preview (ArcadeEmbed o ScratchEmbed según platform), ThumbnailPicker, campos editables. Server action `updateGame` |

### Server Actions (games / thumbnails)

| Acción | Archivo | Propósito |
|--------|---------|-----------|
| `createGame` | `lib/actions/games.ts` | Crea juego (MakeCode o Scratch según URL). Acepta `thumbnail_url`, guarda `platform` |
| `toggleVisibility` | `lib/actions/games.ts` | Oculta/muestra juego |
| `deleteGame` | `lib/actions/games.ts` | Elimina juego |
| `uploadThumbnail` | `lib/actions/thumbnails.ts` | Sube imagen a Supabase Storage → URL pública |
| `updateGame` | `lib/actions/games.ts` | Edita título, descripción, categoría y miniatura de un juego (solo dueño) |

### Perfil

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| ProfileHeader | `components/ProfileHeader.tsx` | Server | `{ profile: ProfileWithStats, isOwnProfile, isFollowing }` — avatar grande, username, bio, website, 4 stat cards (estrellas, juegos, seguidores, siguiendo), botón follow |
| ProfileBadges | `components/ProfileBadges.tsx` | Server | `{ badges: { badges: Badge }[] }` — grid de emblemas con hover tooltip. Se oculta si no hay badges |
| ProfileGameCard | `components/ProfileGameCard.tsx` | Server | `{ game: GameWithDetails, isOwner }` — card con thumbnail, status badge, vistas/rating/fecha, acciones (jugar, editar, ocultar, eliminar solo si es dueño) |
| ProfileTabs | `components/ProfileTabs.tsx` | Client | `{ games[], badges[], isOwner }` — tabs "Juegos" (default) y "Logros" (solo si tiene badges). Indicador rojo en tab activo |
| FollowButton | `components/FollowButton.tsx` | Client | `{ targetUserId, isFollowing }` — botón Seguir/Siguiendo con useActionState |
| GameActionsInline | `components/GameActionsInline.tsx` | Client | `ToggleVisibilityButton(gameId, hidden)` y `DeleteGameButton(gameId)` — wrappers useActionState para evitar inline "use server" en client components |

### Auth

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| LoginForm | `components/LoginForm.tsx` | Client | `useActionState(signIn)` |
| SignUpForm | `components/SignUpForm.tsx` | Client | `useActionState(signUp)` |

### UI (shadcn)

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| Button | `components/ui/button.tsx` | Botones con variantes |
| Card | `components/ui/card.tsx` | Contenedores de contenido |
| Input | `components/ui/input.tsx` | Campos de texto |
| Badge | `components/ui/badge.tsx` | Tags y categorías |
| Skeleton | `components/ui/skeleton.tsx` | Loading states |
| Separator | `components/ui/separator.tsx` | Divisores |
| Avatar | `components/ui/avatar.tsx` | Avatares de usuario |
| Dialog | `components/ui/dialog.tsx` | Modales |
| Select | `components/ui/select.tsx` | Selectores |
| Label | `components/ui/label.tsx` | Labels de formulario |
| Toast/Toaster | `components/ui/toast.tsx` | Notificaciones |
| Rating | `components/Rating.tsx` | Sistema de 5 estrellas |

## Hooks

| Hook | Archivo | Propósito |
|------|---------|-----------|
| use-debounce | `hooks/use-debounce.ts` | Debounce genérico (300ms en SearchBar) |
| use-toast | `hooks/use-toast.ts` | Estado global de toasts |

## Server Actions

| Action | Archivo | Propósito |
|--------|---------|-----------|
| createGame | `lib/actions/games.ts` | Publicar juego (award badges automáticos) |
| updateGame | `lib/actions/games.ts` | Editar juego (solo dueño) |
| toggleVisibility | `lib/actions/games.ts` | Ocultar/mostrar juego |
| deleteGame | `lib/actions/games.ts` | Eliminar juego |
| getGames | `lib/actions/games.ts` | Listar juegos (búsqueda, filtro, paginación) |
| getGameById | `lib/actions/games.ts` | Detalle de juego + tags + ratings |
| getUserGames | `lib/actions/games.ts` | Juegos públicos de un usuario |
| getMyGames | `lib/actions/games.ts` | Juegos del usuario actual |
| getRecentGames | `lib/actions/games.ts` | Últimos juegos (ordenados por created_at) |
| getMostPlayed | `lib/actions/games.ts` | Juegos por views |
| getTopRated | `lib/actions/games.ts` | Juegos por avg_rating |
| rateGame | `lib/actions/ratings.ts` | Votar juego (upsert, award badges al votante y al dueño) |
| uploadThumbnail | `lib/actions/thumbnails.ts` | Subir miniatura a Supabase Storage |
| getProfileByUsername | `lib/actions/profile.ts` | Perfil completo con stats computadas (juegos, estrellas, avg rating, seguidores, siguiendo, badges) |
| updateMyProfile | `lib/actions/profile.ts` | Editar bio, website, avatar |
| followUser | `lib/actions/social.ts` | Seguir usuario |
| unfollowUser | `lib/actions/social.ts` | Dejar de seguir usuario |
| isFollowing | `lib/actions/social.ts` | Check si el usuario autenticado sigue a otro |
| getFollowers | `lib/actions/social.ts` | Lista de seguidores de un usuario |
| getFollowing | `lib/actions/social.ts` | Lista de seguidos de un usuario |
| checkAndAwardBadges | `lib/actions/badges.ts` | Evaluar y otorgar badges según logros |
| getAllBadges | `lib/actions/badges.ts` | Listar catálogo de badges |
| signIn | `lib/actions/auth.ts` | Iniciar sesión |
| signUp | `lib/actions/auth.ts` | Registrarse |
| signOut | `lib/actions/auth.ts` | Cerrar sesión |
