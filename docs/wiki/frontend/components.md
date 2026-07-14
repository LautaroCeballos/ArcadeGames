---
title: "ArcadePlay — Inventario de Componentes Frontend"
tags: [frontend, architecture]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/2026-07-13-figma-adaptation.md
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
| `/juego/[id]` | `app/(public)/juego/[id]/page.tsx` | ArcadeEmbed, Rating, Badge |
| `/perfil/[username]` | `app/(public)/perfil/[username]/page.tsx` | GameCard |
| `/login` | `app/(public)/login/page.tsx` | LoginForm |
| `/signup` | `app/(public)/signup/page.tsx` | SignUpForm |
| `/subir` | `app/(protected)/subir/page.tsx` | SubmitGameForm |
| `/dashboard` | `app/(protected)/dashboard/page.tsx` | GameActions |

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
| ArcadeEmbed | `components/ArcadeEmbed.tsx` | Client | `url, title` — iframe 4:3 con loading |
| RankingSection | `components/RankingSection.tsx` | Server | 4 períodos (Ayer, Semana, Mes, Año) — mock data reemplazable |
| PodiumCard | `components/PodiumCard.tsx` | Server | Podio decorativo con trofeo |

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
| createGame | `lib/actions/games.ts` | Publicar juego |
| toggleVisibility | `lib/actions/games.ts` | Ocultar/mostrar juego |
| deleteGame | `lib/actions/games.ts` | Eliminar juego |
| getGames | `lib/actions/games.ts` | Listar juegos (búsqueda, filtro, paginación) |
| getGameById | `lib/actions/games.ts` | Detalle de juego + tags + ratings |
| getUserGames | `lib/actions/games.ts` | Juegos públicos de un usuario |
| getMyGames | `lib/actions/games.ts` | Juegos del usuario actual |
| getRecentGames | `lib/actions/games.ts` | Últimos juegos (ordenados por created_at) |
| getMostPlayed | `lib/actions/games.ts` | Juegos por views |
| getTopRated | `lib/actions/games.ts` | Juegos por avg_rating |
| rateGame | `lib/actions/ratings.ts` | Votar juego (upsert) |
| signIn | `lib/actions/auth.ts` | Iniciar sesión |
| signUp | `lib/actions/auth.ts` | Registrarse |
| signOut | `lib/actions/auth.ts` | Cerrar sesión |
