---
title: "ArcadePlay — Estado del Proyecto"
tags: [state, checkpoint]
last_updated: "2026-07-20"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - next.config.ts
  - docs/raw/plans/2026-07-20-submit-form-tags-redesign.md
---

# ArcadePlay — Estado del Proyecto

Checkpoint de implementación al 20/07/2026. Este documento captura el estado completo del proyecto para evitar pérdida de contexto.

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
    cuenta/page.tsx       ← Administrar cuenta (info registro, editar perfil, cambiar contraseña)
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
| `ScratchEmbed.tsx` | Client | `url, title` — iframe con `allowtransparency`, aspect 485/402, loading/fallback |
| `GameTabs.tsx` | Client | `gameId, title, platform?, embedUrl?` — tabs adaptativos: MakeCode → Juego + Editor; Scratch → solo Juego |
| `GameActions.tsx` | Client | `gameId, hidden` — ocultar/eliminar |
| `RankingSection.tsx` | Server | Ranking real de jugadores conectado a DB (suma de ratings recibidos). Layout: podio (top 3) + lista (#4-#50). Recibe `players: PlayerRankingEntry[]` |
| `PodiumCard.tsx` | Server | Top 3 destacado con trofeos y cards individuales. 2° | 1° (featured) | 3°. Recibe `topPlayers: PlayerRankingEntry[]` |
| `Rating.tsx` | Client | `gameId, avgRating, userRating` |
| `SearchBar.tsx` | Client | Debounce 300ms, URL search params |
| `CategoryFilter.tsx` (→ `TagFilter`) | Client | Pills de tags, URL param `?tag=` |
| `SubmitGameForm.tsx` | Client | `tags[]` — Step 1 selector plataforma visual + Step 2 2 columnas (preview+tags izq, inputs der), TagPicker |
| `TagPicker.tsx` | Client | `tags, selectedIds, onChange, lockedIds?, max?` — visual multi-select, 8 colores, locked tag |
| `DashboardCard.tsx` | Client | `{ game }` — card horizontal con thumbnail, status, stats, acciones |
| `EditGameForm.tsx` | Client | `{ game, categories, username }` — formulario pre-cargado con preview según platform, ThumbnailPicker |
| `ProfileHeader.tsx` | Server | `{ profile, isOwnProfile, isFollowing }` — avatar, username, bio, website, stats bar (estrellas, juegos, seguidores, siguiendo), follow button |
| `ProfileBadges.tsx` | Server | `{ badges[] }` — grid de emblemas ganados con tooltip hover |
| `ProfileGameCard.tsx` | Server | `{ game, isOwner }` — card de juego con thumbnail, status badge, stats, acciones (editar, ocultar, eliminar si es dueño) |
| `ProfileTabs.tsx` | Client | `{ games[], badges[], isOwner }` — tabs Juegos + Logros (si tiene badges) |
| `FollowButton.tsx` | Client | `{ targetUserId, isFollowing }` — botón seguir/dejar de seguir con useActionState |
| `GameActionsInline.tsx` | Client | `ToggleVisibilityButton`, `DeleteGameButton` — wrappers useActionState para acciones inline |
| `AuthButton.tsx` | Server | Form action `signOut` |
| `LoginForm.tsx` | Client | `useActionState(signIn)` — campo "Usuario o email", contraseña con toggle de visibilidad |
| `SignUpForm.tsx` | Client | `useActionState(signUp)` + `useActionState(resendVerificationEmail)`. Campos: username sanitizado, email, password + confirmación (con toggle visibilidad), mes/año nacimiento (Select+Input), país (selector ISO), pantalla de éxito con reenvío de email |
| `AccountForm.tsx` | Client | `{ profile }` — panel colapsable con botón "Editar Perfil". Avatar upload (Storage), username checker onBlur, bio, fecha nacimiento, país |
| `ChangePasswordForm.tsx` | Client | Formulario de cambio de contraseña con confirmación y toggle de visibilidad |
| `ui/*.tsx` | — | button, card, input, toast, badge, etc. |

### `/lib/` — Lógica
| Archivo | Propósito |
|---------|-----------|
| `supabase/client.ts` | Browser client (createBrowserClient) |
| `supabase/server.ts` | Server client (cookies, RSC) |
| `supabase/middleware.ts` | Session refresh middleware (usado por proxy.ts) |
| `actions/auth.ts` | signIn, signUp, resendVerificationEmail, signOut — sanitización de username, validación de password (mayúscula+minúscula+número+min8), confirmación de contraseña, campos birth_month/birth_year/country |
| `actions/games.ts` | createGame, updateGame, toggleVisibility, deleteGame, getGames, getGameById, getUserGames, getMyGames, getRecentGames, getMostPlayed, getTopRated |
| `actions/ratings.ts` | rateGame (upsert — awards badges to rater + game owner) |
| `actions/thumbnails.ts` | uploadThumbnail |
| `actions/profile.ts` | getProfileByUsername, updateMyProfile, updateAccount (perfil completo + avatar upload), updatePassword, checkUsername |
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
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `00001_initial_schema.sql` | Creación de tablas + RLS + seed | ✅ Ejecutada |
| `00002_profiles_badges_follows.sql` | Badges, follows, bio/website en profiles | ✅ Ejecutada |
| `00003_add_platform.sql` | Columna `platform` en games + índice | ✅ Ejecutada |
| `00004_revoke_public_execute.sql` | Revocar EXECUTE público en funciones SECURITY DEFINER | ✅ Ejecutada |
| `00005_tags_migration.sql` | Seed tags + migrar category_id + drop columna | ✅ Ejecutada |
| `00006_more_tags.sql` | Más tags adicionales | ✅ Ejecutada |
| `00007_profiles_birth_country.sql` | birth_month, birth_year, country en profiles | ✅ Ejecutada |
| `00008_profiles_email_display_name.sql` | Columna `email` en profiles, trigger actualizado (usa `raw_user_meta_data->>'username'`) | ✅ Ejecutada |
| `00009_avatars_storage.sql` | Bucket `avatars` en Storage con RLS policies | ✅ Ejecutada |

---

## Base de datos (ejecutada ✅)

Migración `supabase/migrations/00001_initial_schema.sql` ejecutada vía MCP Supabase:

| Tabla | Filas | RLS |
|-------|-------|-----|
| `profiles` | 0 (se crean al registrarse, con birth_month/birth_year/country opcionales) | ✅ |
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
- **Registro**: Formulario en `/signup` → `supabase.auth.signUp()` con campos sanitizados (username, email, password + confirmación, birth_month, birth_year, country) → trigger crea perfil. Pantalla de éxito con opción de reenviar email de verificación
- **Login**: Formulario en `/login` con campo "Usuario o email" → `signIn()` busca username en `profiles` (case-insensitive) o usa email directo → `supabase.auth.signInWithPassword()` → redirect a `/dashboard`
- **Cuenta**: Página `/cuenta` con info del registro, edición de perfil (avatar upload, username checker, bio, fecha, país) y cambio de contraseña
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

### Filtro por tags ✅
- TagFilter (antes CategoryFilter) con pills + URL params `?tag=`
- Tags incluyen platform tags + 10 categorías migradas
- Filtro por tag ID funciona tanto en server (getGames) como client (LoadMoreGames)

### Sistema de tags implementado ✅
- Tags reemplazan completamente a category_id
- TagPicker visual: burbujas coloridas, multiselección, locked tag, 8 colores rotativos
- SubmitGameForm rediseñado: Step 1 (selector plataforma visual) → Step 2 (2 columnas, preview izquierda, inputs derecha, TagPicker, ThumbnailPicker)
- EditGameForm actualizado: TagPicker en vez de Select categoría
- Migración DB: 12 tags seeded, 16 game_tags creados (8 juegos × 2 tags), category_id dropeada
- Juego/[id] muestra tags como badges (platform tag con color distintivo)

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
- Preview condicional según platform (`ArcadeEmbed` o `ScratchEmbed`)
- Campos editables: título, descripción, categoría, miniatura
- Server action `updateGame` con verificación de ownership
- ThumbnailPicker integrado con platform-aware

### Miniatura de juegos ✅
- Auto-thumbnail desde API de MakeCode (vía `fetchProjectThumbnailUrl`)
- Subida manual de imagen a Supabase Storage (bucket `game-thumbnails`)
- Grid de thumbnails seleccionables
- Para Scratch: solo subida manual (no hay API pública de thumbnails)
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

1. ✅ ~~Reemplazar datos mock del ranking con queries reales de ratings~~ (2026-07-20)
2. 🔴 **Aplicar migración Realtime**: Ejecutar `supabase migration up` para `00015_enable_realtime_notifications.sql` (agrega `notifications` a `supabase_realtime`). Sin esto, las notificaciones en vivo no funcionan.
3. 🔵 Conectar HeroSlider a CMS o datos dinámicos
4. 🔵 Contador de vistas (increment en cada visita)
5. 🔵 Modo oscuro
6. 🔵 Página 404 personalizada con search

## Implementado recientemente

- ✅ **Sistema de moderación** (2026-07-20)
  - Roles: `user`, `moderator`, `admin` en tabla `profiles`
  - Juegos nuevos se crean como `pending` en vez de `approved`
  - Panel de moderación en `/moderar` con tabs (pendientes/aprobados/rechazados/todos)
  - Acciones: aprobar, rechazar, ocultar/mostrar, eliminar cualquier juego
  - Admins pueden asignar roles desde `/admin/usuarios`
  - Moderadores ven juegos no aprobados en perfiles ajenos
  - Ver [[features/moderacion]]

> Leyenda: 🔴 Crítico · 🟡 Importante · 🟢 Nice-to-have · 🔵 Futuro

---

## Archivos clave referenciados

Ver [[architecture/routes]] para estructura de rutas.
Ver [[database/schema]] para esquema de tablas.
Ver [[auth/flow]] para flujo de autenticación.
Ver [[features/games]] para sistema de juegos.
Ver [[frontend/components]] para inventario de componentes.
Ver [[frontend/design-tokens]] para sistema visual.
