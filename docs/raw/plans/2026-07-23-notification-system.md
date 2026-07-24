---
title: "ArcadePlay — Sistema de Notificaciones"
tags: [feature, notifications, plan]
last_updated: "2026-07-23"
sources:
  - lib/actions/games.ts
  - lib/actions/social.ts
  - lib/actions/ratings.ts
  - lib/definitions.ts
  - components/Navbar.tsx
  - components/NavbarClient.tsx
  - supabase/migrations/00002_profiles_badges_follows.sql
  - app/(protected)/layout.tsx
---

# Sistema de Notificaciones

## Tipos de notificación

| Tipo | Disparador | Destinatario | Mensaje |
|------|-----------|-------------|---------|
| `game_approved` | `approveGame` | Dueño del juego | "¡Tu juego \"{título}\" fue aprobado!" |
| `game_rejected` | `rejectGame` | Dueño del juego | "Tu juego \"{título}\" fue rechazado. Motivo: {razón}" |
| `new_game_from_following` | `approveGame` (fan-out) | Seguidores del creador | "{username} publicó un nuevo juego: {título}" |
| `new_rating` | `rateGame` | Dueño del juego | "{username} le dio {value} estrellas a tu juego \"{título}\"" |
| `new_follower` | `followUser` | Usuario seguido | "{username} empezó a seguirte" |

## Tabla `notifications` (migración `00014_notifications.sql`)

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in (
    'game_approved', 'game_rejected',
    'new_game_from_following',
    'new_rating', 'new_follower'
  )),
  title text not null,
  message text not null,
  link_url text not null,
  actor_id uuid references profiles(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, created_at desc);
create index idx_notifications_unread on notifications(user_id) where not read;
```

### RLS

| Operación | Policy |
|-----------|--------|
| SELECT | `auth.uid() = user_id` |
| INSERT | Bypass desde server actions (service_role) |
| UPDATE | `auth.uid() = user_id` (solo `read`) |

## Tipos TypeScript (`lib/definitions.ts`)

```typescript
export type NotificationType =
  | 'game_approved'
  | 'game_rejected'
  | 'new_game_from_following'
  | 'new_rating'
  | 'new_follower'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link_url: string
  actor_id: string | null
  read: boolean
  created_at: string
}

export interface UnreadCount {
  count: number
}
```

## Server Actions (`lib/actions/notifications.ts`)

Todas usan `"use server"` y `createClient()`.

| Función | Descripción | Query |
|---------|-------------|-------|
| `getUnreadCount()` | Contador de no leídas | `select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false)` |
| `getNotifications(page, limit)` | Lista paginada | `select("*").eq("user_id", user.id).order("created_at", { ascending: false }).range(...)` |
| `getRecentNotifications(limit = 5)` | Últimas N para dropdown | `select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit)` |
| `markAsRead(notificationId)` | Marcar una como leída | `update({ read: true }).eq("id", notificationId).eq("user_id", user.id)` |
| `markAllAsRead()` | Marcar todas como leídas | `update({ read: true }).eq("user_id", user.id).eq("read", false)` |

Helper interno (sin `"use server"`):

| Función | Descripción |
|---------|-------------|
| `createNotification({ user_id, type, title, message, link_url, actor_id })` | INSERT directo desde el server action que dispara la notificación |

## Puntos de inserción

### `approveGame` (`lib/actions/games.ts:669`)

Después de aprobar el juego:

1. **Notificar al dueño**: `createNotification({ user_id: game.user_id, type: 'game_approved', ... })`
2. **Fan-out a seguidores**: Buscar followers del creador, crear `new_game_from_following` para cada uno

```typescript
// Después del UPDATE status = 'approved'
const { data: game } = await supabase
  .from("games")
  .select("id, title, user_id, profiles!games_user_id_fkey(username)")
  .eq("id", gameId)
  .single()

// 1. Notificar al dueño
await createNotification({
  user_id: game.user_id,
  type: 'game_approved',
  title: 'Juego aprobado',
  message: `¡Tu juego "${game.title}" fue aprobado y ya está visible!`,
  link_url: `/juego/${gameId}`,
  actor_id: null, // fue el moderador
})

// 2. Fan-out a seguidores
const { data: followers } = await supabase
  .from("follows")
  .select("follower_id")
  .eq("following_id", game.user_id)

if (followers) {
  const notifications = followers.map(f => ({
    user_id: f.follower_id,
    type: 'new_game_from_following' as const,
    title: 'Nuevo juego publicado',
    message: `${game.profiles?.username ?? 'Alguien'} publicó un nuevo juego: "${game.title}"`,
    link_url: `/juego/${gameId}`,
    actor_id: game.user_id,
  }))
  await supabase.from("notifications").insert(notifications)
}
```

### `rejectGame` (`lib/actions/games.ts:686`)

```typescript
const { data: game } = await supabase
  .from("games")
  .select("id, title, user_id")
  .eq("id", gameId)
  .single()

await createNotification({
  user_id: game.user_id,
  type: 'game_rejected',
  title: 'Juego rechazado',
  message: reason
    ? `Tu juego "${game.title}" fue rechazado. Motivo: ${reason}`
    : `Tu juego "${game.title}" fue rechazado.`,
  link_url: `/perfil/{username}`,
  actor_id: null,
})
```

### `rateGame` (`lib/actions/ratings.ts:7`)

```typescript
const { data: rater } = await supabase
  .from("profiles")
  .select("username")
  .eq("id", user.id)
  .single()

const { data: game } = await supabase
  .from("games")
  .select("title, user_id")
  .eq("id", gameId)
  .single()

if (game && game.user_id !== user.id) {
  await createNotification({
    user_id: game.user_id,
    type: 'new_rating',
    title: 'Nueva estrella',
    message: `${rater?.username ?? 'Alguien'} le dio ${value} estrellas a tu juego "${game.title}"`,
    link_url: `/juego/${gameId}`,
    actor_id: user.id,
  })
}
```

### `followUser` (`lib/actions/social.ts:6`)

```typescript
const { data: follower } = await supabase
  .from("profiles")
  .select("username")
  .eq("id", user.id)
  .single()

await createNotification({
  user_id: targetUserId,
  type: 'new_follower',
  title: 'Nuevo seguidor',
  message: `${follower?.username ?? 'Alguien'} empezó a seguirte`,
  link_url: `/perfil/${follower?.username ?? user.id}`,
  actor_id: user.id,
})
```

## UI

### Navbar (`components/Navbar.tsx` + `NavbarClient.tsx`)

**`Navbar.tsx`** (Server Component):
- Agregar query de `unreadCount` y últimas 5 notificaciones
- Pasarlas como props a `NavbarClient`

**`NavbarClient.tsx`**:
- Nuevo ícono `Bell` de lucide-react entre `Upload` y `User`
- Badge rojo con `unreadCount` (solo si > 0)
- Dropdown al hacer clic con:
  - Header "Notificaciones"
  - Lista de últimas 5 notificaciones
  - Cada ítem: ícono según type (CheckCircle, XCircle, Gamepad2, Star, UserPlus), mensaje, timestamp relativo ("hace X min"), dot azul si no leída
  - Click en ítem → `markAsRead(id)` + `router.push(link_url)`
  - Si hay no leídas: botón "Marcar todas como leídas"
  - Footer: link "Ver todas" → `/notificaciones`
  - Estados: vacío ("No hay notificaciones"), carga (skeleton)
- Mobile: ítem extra en el menú hamburguesa "Notificaciones" (con badge)

### Página `/notificaciones` (`app/(protected)/notificaciones/page.tsx`)

- Server Component con paginación (cargar más)
- Card para cada notificación: icono + mensaje + timestamp
- No leídas con fondo sutil y dot azul
- Click → `markAsRead()` + navegar
- Botón flotante "Marcar todas como leídas"

## Rutas

- `/notificaciones` — bajo `(protected)`, protegida por middleware existente (cualquier usuario autenticado)

## Orden de implementación

1. Migración SQL `00014_notifications.sql` (crear tabla + RLS)
2. Tipos en `lib/definitions.ts` (AppNotification, NotificationType)
3. `lib/actions/notifications.ts` (createNotification, getUnreadCount, getNotifications, getRecentNotifications, markAsRead, markAllAsRead)
4. Modificar `approveGame` (notificar dueño + fan-out a seguidores)
5. Modificar `rejectGame` (notificar dueño)
6. Modificar `rateGame` (notificar dueño del juego)
7. Modificar `followUser` (notificar al seguido)
8. Actualizar `Navbar.tsx` (fetch unreadCount + últimas 5)
9. Actualizar `NavbarClient.tsx` (Bell icon + dropdown)
10. Crear `app/(protected)/notificaciones/page.tsx`
11. `npm run build`
12. Actualizar wiki ([[features/notifications]], [[database/schema]], [[frontend/components]], [[architecture/routes]], [[index]], [[log]])

## Archivos a modificar/crear

- **Crear**: `supabase/migrations/00014_notifications.sql`
- **Modificar**: `lib/definitions.ts`
- **Crear**: `lib/actions/notifications.ts`
- **Modificar**: `lib/actions/games.ts` (approveGame, rejectGame)
- **Modificar**: `lib/actions/ratings.ts` (rateGame)
- **Modificar**: `lib/actions/social.ts` (followUser)
- **Modificar**: `components/Navbar.tsx`
- **Modificar**: `components/NavbarClient.tsx`
- **Crear**: `app/(protected)/notificaciones/page.tsx`

## Criterios de aceptación

- [ ] Al aprobar un juego, el dueño recibe notificación
- [ ] Al aprobar un juego, los seguidores del creador reciben notificación
- [ ] Al rechazar un juego, el dueño recibe notificación (con razón si fue provista)
- [ ] Al votar, el dueño del juego recibe notificación (excepto si vota su propio juego)
- [ ] Al seguir a alguien, esa persona recibe notificación
- [ ] Navbar muestra ícono Bell con badge de no leídas
- [ ] Dropdown en Bell muestra últimas 5 notificaciones
- [ ] Click en notificación → marca como leída + navega
- [ ] "Marcar todas como leídas" funciona
- [ ] `/notificaciones` muestra historial completo paginado
- [ ] Build exitoso sin errores TypeScript
