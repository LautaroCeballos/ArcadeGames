---
title: "ArcadePlay — Sistema de Follows"
tags: [feature, social]
last_updated: "2026-07-23"
sources:
  - lib/actions/social.ts
  - components/FollowButton.tsx
  - components/FollowList.tsx
  - components/ProfileHeader.tsx
  - components/ProfileStats.tsx
  - hooks/use-realtime-follow-counts.ts
  - app/(public)/perfil/[username]/page.tsx
  - lib/actions/profile.ts
  - supabase/migrations/00002_profiles_badges_follows.sql
  - supabase/migrations/00016_enable_realtime_follows.sql
  - docs/raw/plans/2026-07-21-fix-follow-system.md
---

# ArcadePlay — Sistema de Follows

## Concepto

Los usuarios pueden seguir a otros usuarios para mantenerse al tanto de sus juegos. El sistema incluye:

- Botón "Seguir"/"Siguiendo" en el perfil de cada usuario
- Contadores de seguidores y siguiendo en el perfil
- Páginas de listado: `/perfil/[username]/seguidores` y `/perfil/[username]/siguiendo`

## Tabla `follows`

**Importante**: La tabla usa PK compuesta `(follower_id, following_id)`. **No tiene columna `id`**.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `follower_id` | UUID (FK → profiles.id) | Usuario que sigue |
| `following_id` | UUID (FK → profiles.id) | Usuario siendo seguido |
| `created_at` | timestamptz | Cuándo se siguió |

**PK**: `(follower_id, following_id)`
**Índices**: `idx_follows_follower` (follower_id), `idx_follows_following` (following_id)

**RLS**:
- SELECT: público (todos pueden leer)
- INSERT: `auth.uid() = follower_id`
- DELETE: `auth.uid() = follower_id`

## ⚠️ Bug histórico: `select("id")` en tabla sin columna `id`

La tabla `follows` tiene PK compuesta, **no tiene columna `id`**. Este bug afectó a 3 lugares distintos en el código, descubiertos progresivamente.

### Bug 1: `isFollowing()` (2026-07-23, `lib/actions/social.ts:73`)

Usaba `select("id")` → error 42703 → siempre devolvía `false`:

```typescript
// ❌ BUG: esta columna no existe en follows
const { data } = await supabase
    .from("follows")
    .select("id")  // ← error 42703
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle()
```

### Bug 2: Contadores en `getProfileByUsername()` (2026-07-23, `lib/actions/profile.ts:28,33`)

Los queries de `followers_count` y `following_count` también usaban `select("id", { count: "exact", head: true })`. Aunque es un count query, PostgREST valida el `select` contra el schema. Como `follows` no tiene `id`, la request devolvía 400 y el contador siempre era 0.

### Impacto combinado

1. **Botón siempre mostraba "Seguir"** — `isFollowing` devolvía `false` aunque el usuario ya siguiera al perfil
2. **Error al hacer clic** — al estar "Seguir" visible, `toggleFollow` llamaba a `followUser` (no `unfollowUser`), que intentaba INSERT duplicado → error 23505 → "Ya sigues a este usuario"
3. **Contadores siempre en 0** — los count queries fallaban con 400
4. **Listas SÍ funcionaban** — `getFollowers`/`getFollowing` seleccionan columnas reales como `follower_id`, `following_id`, no `id`

### Fix aplicado

```typescript
// ✅ isFollowing — `lib/actions/social.ts:73`
.select("follower_id")  // columna real
.maybeSingle()
// con manejo de error: console.error + return false

// ✅ Contadores — `lib/actions/profile.ts:28,33`
.select("follower_id", { count: "exact", head: true })  // columna real
```

## Server Actions (`lib/actions/social.ts`)

| Función | Input | Output | Descripción |
|---------|-------|--------|-------------|
| `followUser` | `targetUserId: string` | `{ error } \| { success: true }` | Inserta follow. Previene self-follow y duplicados (23505). Revalida perfil + listas. |
| `unfollowUser` | `targetUserId: string` | `{ error } \| { success: true }` | Elimina follow. Revalida perfil + listas. |
| `isFollowing` | `targetUserId: string` | `Promise<boolean>` | Verifica si hay un follow activo. Usa `select("follower_id")` (columna real). |
| `getFollowers` | `username: string` | `FollowUserItem[]` | Lista de seguidores con perfil. |
| `getFollowing` | `username: string` | `FollowUserItem[]` | Lista de usuarios que sigue. |

### Revalidación

Cada follow/unfollow ejecuta:

```typescript
revalidatePath(`/perfil/${username}`, "page")
revalidatePath(`/perfil/${username}/seguidores`, "page")
revalidatePath(`/perfil/${username}/siguiendo`, "page")
revalidatePath("/perfil", "layout")
refresh() // next/cache — refresca router del cliente
```

El `refresh()` de `next/cache` es clave para que el cliente de Next.js 16 refresque automáticamente el Server Component sin recarga manual, mostrando los contadores actualizados.

## Componente `FollowList` (`components/FollowList.tsx`)

```tsx
interface FollowListProps {
  users: FollowUserItem[]
  followingMap: Set<string>
  emptyMessage: string
  currentUserId?: string     // ← oculta botón para el mismo usuario
}
```

Renderiza la lista de usuarios con avatar, nombre y `FollowButton`. Recibe `followingMap` para saber a quiénes ya sigue el usuario autenticado.

**Comportamiento especial**: si `currentUserId === user.id`, no se renderiza el `FollowButton` para ese usuario (no te puedes seguir a ti mismo). Esto aplica en ambas listas: seguidores y siguiendo.

**Uso** (`app/(public)/perfil/[username]/seguidores/page.tsx` y `siguiendo/page.tsx`):
```tsx
<FollowList
  users={users}
  followingMap={followingMap}
  emptyMessage="..."
  currentUserId={user?.id}
/>
```

## Componente `FollowButton` (`components/FollowButton.tsx`)

```tsx
interface FollowButtonProps {
  targetUserId: string
  isFollowing: boolean
}
```

**Comportamiento**:
- Usa `useActionState` de React 19 con un server action interno `toggleFollow`
- `toggleFollow` determina si llamar a `followUser` o `unfollowUser` según `prevState.isFollowing`
- El estado `isFollowing` se gestiona localmente en el `useActionState` (optimistic)
- Muestra spinner (`Loader2`) mientras `pending` es true
- Muestra error debajo del botón si la acción falla
- `variant="outline"` cuando sigue, `variant="default"` cuando no

### Refactor (2026-07-21)

El componente fue refactorizado del patrón anterior (wrapper cliente con `useRouter().refresh()`) al patrón actual con `useActionState`:

**Antes** (roto):
```tsx
// ❌ wrapper cliente + router.refresh()
const handleSubmit = async (formData: FormData) => { ... }
<form action={handleSubmit}>
```
**Después** (correcto):
```tsx
// ✅ useActionState con server action directo
const [state, formAction, pending] = useActionState(toggleFollow, initialState)
<form action={formAction}>
```

## Contadores en perfil (`lib/actions/profile.ts`)

`getProfileByUsername` computa los contadores con `.count("exact", head: true)`:

```typescript
const { count: followers_count } = await supabase
  .from("follows")
  .select("follower_id", { count: "exact", head: true })
  .eq("following_id", profile.id)

const { count: following_count } = await supabase
  .from("follows")
  .select("follower_id", { count: "exact", head: true })
  .eq("follower_id", profile.id)
```

⚠️ **Bug conocido (2026-07-23)**: Originalmente usaba `select("id")`. PostgREST valida el `select` contra el schema aunque sea `head:true`. Como `follows` no tiene columna `id`, devolvía 400 → contadores siempre en 0. Fix: `select("follower_id")`.

## Realtime en contadores de perfil

Los contadores de seguidores/siguiendo se actualizan en tiempo real cuando otro usuario sigue o deja de seguir al perfil visitado.

### Mecanismo

```
Supabase DB (INSERT/DELETE on follows WHERE following_id = profileUserId)
  │
  ▼  (WebSocket vía Realtime — respeta RLS)
useRealtimeFollowCounts hook
  │
  └──▶ ProfileStats: badge count en vivo
```

### Hook `useRealtimeFollowCounts` (`hooks/use-realtime-follow-counts.ts`)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `profileUserId` | `string` | ID del usuario dueño del perfil |
| `initialFollowersCount` | `number` | Contador inicial del servidor |
| `initialFollowingCount` | `number` | Contador inicial del servidor |

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `followersCount` | `number` | Contador de seguidores en vivo |
| `followingCount` | `number` | Contador de siguiendo en vivo |

Comportamiento:
- **INSERT** (alguien sigue al perfil): incrementa `followersCount`
- **DELETE** (alguien deja de seguir): decrementa `followersCount`
- **Cleanup**: `supabase.removeChannel()` al desmontar
- **Initial data**: solo se aplica en el primer montaje (`didInit.current` flag), igual que `useRealtimeNotifications`

### SQL requerido

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
```

Migración: `supabase/migrations/00016_enable_realtime_follows.sql`

### Componente `ProfileStats` (`components/ProfileStats.tsx`)

Client Component que envuelve la grilla de stats del perfil. Usa `useRealtimeFollowCounts` para mantener los contadores de seguidores y siguiendo actualizados en vivo. Reemplazó la grilla inline que estaba en `ProfileHeader`.

## Flujo completo

```
Usuario hace clic en "Seguir"
  → form action → useActionState
    → toggleFollow (cliente, determina follow vs unfollow)
      → followUser (server action)
        → INSERT en follows
        → revalidatePath (perfil + listas)
        → refresh() (next/cache → refresca router cliente)
      → Retorna nuevo estado { isFollowing: true }
  → useActionState actualiza state
  → Botón se renderiza como "Siguiendo" (outline)
  → Server Component se re-renderiza con contadores actualizados
```

## Historial de bugs

| Fecha | Bug | Causa | Fix |
|-------|-----|-------|-----|
| 2026-07-23 | `isFollowing` siempre false | `select("id")` en tabla sin columna `id` | Cambiado a `select("follower_id")` + manejo de error |
| 2026-07-23 | Contadores siempre en 0 | Mismo `select("id")` en count queries | Cambiado a `select("follower_id")` en ambos count |
| 2026-07-23 | Botón "Seguir" visible en propia lista | `FollowList` mostraba botón incluso para el usuario autenticado | Agregado `currentUserId` prop, oculta botón si coincide |
| 2026-07-21 | Contadores no se actualizan post-follow | Falta `refresh()` + revalidación de listas | Agregado `refresh()` y `revalidatePath` para listas |
| 2026-07-21 | Botón no cambia de estado post-follow | Wrapper cliente impedía single-roundtrip | Refactor a `useActionState` |

## Archivos relacionados

- `lib/actions/social.ts` — Server actions de follows
- `lib/actions/profile.ts` — `getProfileByUsername` con contadores
- `components/FollowButton.tsx` — Botón con `useActionState`
- `components/FollowList.tsx` — Lista reusable para seguidores/siguiendo
- `components/ProfileHeader.tsx` — Header de perfil con stats y botón
- `components/ProfileStats.tsx` — Grilla de stats con Realtime
- `hooks/use-realtime-follow-counts.ts` — Hook de suscripción Realtime para contadores
- `app/(public)/perfil/[username]/page.tsx` — Página de perfil
- `app/(public)/perfil/[username]/seguidores/page.tsx` — Página de seguidores
- `app/(public)/perfil/[username]/siguiendo/page.tsx` — Página de siguiendo
- `supabase/migrations/00002_profiles_badges_follows.sql` — Schema de follows
- `supabase/migrations/00016_enable_realtime_follows.sql` — Realtime en follows
- `docs/raw/plans/2026-07-21-fix-follow-system.md` — Plan de la fix
