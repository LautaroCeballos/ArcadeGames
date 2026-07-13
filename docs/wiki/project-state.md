---
title: "ArcadePlay — Estado del Proyecto"
tags: [state, checkpoint]
last_updated: "2026-07-13"
sources:
  - package.json
  - next.config.ts
---

# ArcadePlay — Estado del Proyecto

Checkpoint de implementación al 13/07/2026. Este documento captura el estado completo del proyecto para evitar pérdida de contexto.

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
    juego/[id]/page.tsx   ← Detalle del juego (embed + rating)
    perfil/[username]/    ← Perfil público del usuario
    login/page.tsx        ← Login form
    signup/page.tsx       ← Signup form

  (protected)/
    layout.tsx            ← Navbar + footer (igual que public)
    subir/page.tsx        ← Formulario de publicación
    dashboard/page.tsx    ← Panel de control
```

### `/components/` — Componentes
| Archivo | Tipo | Props clave |
|---------|------|-------------|
| `Navbar.tsx` | Server | Lee sesión, muestra auth links |
| `AuthButton.tsx` | Server | Form action `signOut` |
| `LoginForm.tsx` | Client | `useActionState(signIn)` |
| `SignUpForm.tsx` | Client | `useActionState(signUp)` |
| `GameCard.tsx` | Server | `game: GameWithDetails` |
| `GameGrid.tsx` | Server | `games: GameWithDetails[]` + Skeleton |
| `LoadMoreGames.tsx` | Client | Paginación "Cargar más" con server action |
| `ArcadeEmbed.tsx` | Client | `url, title` — iframe con loading/fallback |
| `Rating.tsx` | Client | `gameId, avgRating, userRating` |
| `SearchBar.tsx` | Client | Debounce 300ms, URL search params |
| `CategoryFilter.tsx` | Client | Pills de categorías, URL params |
| `SubmitGameForm.tsx` | Client | `categories`, action `createGame` |
| `GameActions.tsx` | Client | `gameId, hidden` — ocultar/eliminar |
| `ui/*.tsx` | — | button, card, input, toast, badge, etc. |

### `/lib/` — Lógica
| Archivo | Propósito |
|---------|-----------|
| `supabase/client.ts` | Browser client (createBrowserClient) |
| `supabase/server.ts` | Server client (cookies, RSC) |
| `supabase/middleware.ts` | Session refresh middleware (usado por proxy.ts) |
| `actions/auth.ts` | signIn, signUp, signOut (useActionState signature) |
| `actions/games.ts` | createGame, toggleVisibility, deleteGame, getGames, getGameById, getUserGames, getMyGames |
| `actions/ratings.ts` | rateGame (upsert) |
| `definitions.ts` | Tipos Database, Game, Profile, Category, Tag, Rating, GameWithDetails |
| `game-utils.ts` | extractGameId, buildEmbedUrl, isValidMakeCodeUrl (3 formatos) |
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

Contenido:
- 6 tablas, RLS policies completas
- Trigger `handle_new_user` para crear perfil automático
- 10 categorías seeded
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
- Formulario en `/subir` con URL de MakeCode
- Validación: URL válida (3 formatos aceptados), ID único, campos obligatorios
- Status inicial: `approved` (auto-approve)
- Preview del embed en vivo mientras se escribe la URL
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
- Listado de juegos del usuario
- Badge de estado (pending/approved/rejected)
- Acciones: ocultar/mostrar, eliminar
- Empty state

### Perfil público ✅
- Vista de juegos por username
- Avatar inicial

### Embebido de juegos ✅
- ArcadeEmbed con loading spinner
- Fallback si el iframe falla
- Aspect ratio 4:3

---

## Pendiente (próximos pasos)

1. 🟡 Confirmar que el trigger de perfil funciona (auto-create en signup)
2. 🔵 Tags en formulario de subida
3. 🔵 Contador de vistas (increment en cada visita)
4. 🔵 Validar que el ID de MakeCode realmente existe (antes de aceptar la URL)
5. 🔵 Modo oscuro
6. 🔵 Página 404 personalizada con search

> Leyenda: 🔴 Crítico · 🟡 Importante · 🟢 Nice-to-have · 🔵 Futuro

---

## Archivos clave referenciados

Ver [[architecture/routes]] para estructura de rutas.
Ver [[database/schema]] para esquema de tablas.
Ver [[auth/flow]] para flujo de autenticación.
Ver [[features/games]] para sistema de juegos.
