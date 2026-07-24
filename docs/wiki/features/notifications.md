---
title: "ArcadePlay — Sistema de Notificaciones"
tags: [feature, notifications]
last_updated: "2026-07-23"
sources:
  - supabase/migrations/00014_notifications.sql
  - supabase/migrations/00015_enable_realtime_notifications.sql
  - lib/actions/notifications.ts
  - lib/notifications.ts
  - lib/definitions.ts
  - components/Navbar.tsx
  - components/NavbarClient.tsx
  - app/(protected)/notificaciones/page.tsx
  - hooks/use-realtime-notifications.ts
  - lib/actions/games.ts
  - lib/actions/social.ts
  - lib/actions/ratings.ts
  - docs/raw/plans/2026-07-23-notification-system.md
  - docs/raw/plans/2026-07-23-notifications-realtime.md
  - docs/raw/plans/2026-07-23-fix-notifications-realtime.md
  - docs/raw/debugging/2026-07-23-notifications-realtime-not-delivered.md
---

# ArcadePlay — Sistema de Notificaciones

## Concepto

Las notificaciones informan a los usuarios sobre eventos importantes: aprobación/rechazo de juegos, nuevos juegos de usuarios seguidos, votos recibidos, y nuevos seguidores. Se implementan con server actions para lectura/escritura y **Supabase Realtime** para delivery instantáneo.

## Tipos de notificación

| Tipo | Disparador | Destinatario | Archivo |
|------|-----------|-------------|---------|
| `game_approved` | `approveGame` | Dueño del juego | `lib/actions/games.ts:669` |
| `game_rejected` | `rejectGame` | Dueño del juego | `lib/actions/games.ts:686` |
| `new_game_from_following` | `approveGame` (fan-out) | Seguidores del creador | `lib/actions/games.ts:669` |
| `new_rating` | `rateGame` | Dueño del juego | `lib/actions/ratings.ts:7` |
| `new_follower` | `followUser` | Usuario seguido | `lib/actions/social.ts:6` |

## Tabla `notifications`

Ver [[database/schema]] para estructura completa.

## Arquitectura

### Helper interno (`lib/notifications.ts`)

- **`createNotification`**: Inserta una notificación vía `supabase.rpc("create_notification", ...)`. Usa la función SQL `create_notification` con `SECURITY DEFINER` para bypass de RLS (el usuario que inserta no es el destinatario).

### Server Actions (`lib/actions/notifications.ts`)

Todas con `"use server"`:

| Función | Descripción |
|---------|-------------|
| `getUnreadCount()` | Contador de no leídas para el usuario autenticado |
| `getNotifications(page, limit)` | Lista paginada de notificaciones |
| `getRecentNotifications(limit = 5)` | Últimas N para dropdown |
| `markAsRead(notificationId)` | Marcar una como leída |
| `markAllAsRead()` | Marcar todas como leídas |

### Puntos de inserción

- **`approveGame`**: Notifica al dueño (`game_approved`) + fan-out a seguidores del creador (`new_game_from_following`)
- **`rejectGame`**: Notifica al dueño (`game_rejected`) con razón opcional
- **`rateGame`**: Notifica al dueño del juego (`new_rating`), excepto si el usuario vota su propio juego
- **`followUser`**: Notifica al usuario seguido (`new_follower`)

## UI

### Navbar

- **`Navbar.tsx`** (Server): Fetcha `unreadCount` + `getRecentNotifications(5)`, los pasa como props a `NavbarClient`
- **`NavbarClient.tsx`**: Ícono Bell con badge rojo de no leídas. Dropdown con últimas 5 notificaciones, cada una con ícono según tipo, mensaje, timestamp relativo, dot azul si no leída. Click → `markAsRead()` + navegación. Botón "Marcar todas leídas". Link "Ver todas" → `/notificaciones`.

### `/notificaciones` (`app/(protected)/notificaciones/page.tsx`)

- Client Component con paginación (cargar más)
- Card para cada notificación con ícono según tipo
- No leídas con fondo sutil y dot azul
- Click → `markAsRead()` + navegar
- Botón "Marcar todas leídas"
- Estados: vacío ("No hay notificaciones"), carga (spinner)

## Realtime (delivery instantáneo)

Desde julio 2026, las notificaciones usan **Supabase Realtime** para aparecer instantáneamente sin recargar la página.

### Arquitectura

```
Supabase DB (INSERT/UPDATE on notifications)
  │
  ▼  (WebSocket vía Realtime — respeta RLS)
useRealtimeNotifications hook / inline subscription
  │
  ├──▶ NavbarClient: badge count + dropdown en vivo
  └──▶ /notificaciones página: lista en vivo
```

### Hook `useRealtimeNotifications` (`hooks/use-realtime-notifications.ts`)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `userId` | `string \| null` | ID del usuario autenticado. null = no suscribirse |
| `initial` | `{ notifications, unreadCount }?` | Datos iniciales para SSR hydration |

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `notifications` | `AppNotification[]` | Lista actualizada (más reciente primero) |
| `unreadCount` | `number` | Contador de no leídas en vivo |

Comportamiento:
- **Initial data**: Se aplica SOLO en el primer montaje (`didInit.current` flag). Los re-renders del Server Component Navbar no sobreescriben el estado Realtime.
- **INSERT**: prepend al inicio + incrementa contador
- **UPDATE**: actualiza el item en el array + ajusta contador si cambió `read`
- **Cleanup**: `supabase.removeChannel()` al desmontar el componente
- **Error de conexión**: Supabase maneja reconexión automática
- **Múltiples pestañas**: todas reciben el evento simultáneamente

### Dónde se usa

| Componente | Tipo de suscripción | Propósito |
|-----------|---------------------|-----------|
| `NavbarClient.tsx` | Hook `useRealtimeNotifications` | Badge + dropdown con últimas 5 |
| `/notificaciones/page.tsx` | Inline subscription (no usa el hook por gestión de paginación) | Lista completa en vivo + UPDATE de read |

### SQL requerido

```sql
alter publication supabase_realtime add table notifications;
```

Esto expone la tabla `notifications` a cambios vía Realtime. RLS sigue protegiendo los datos.

## Consideraciones de diseño

- Las notificaciones usan la función `create_notification` con `SECURITY DEFINER` para insertar, ya que el usuario que realiza la acción (ej. moderador) no es el destinatario
- RLS protege SELECT y UPDATE (solo el dueño de la notificación puede leer/marcar)
- Realtime respeta RLS — cada usuario recibe solo sus propias filas
- El fan-out de `new_game_from_following` se dispara al **aprobar** el juego, no al crearlo
- El plan Free de Supabase tiene límite de 200 conexiones Realtime simultáneas — suficiente para ArcadePlay

### Verificación: Realtime funciona con SECURITY DEFINER

> [!note] Hallazgo de debugging (2026-07-23)
> Se confirmó experimentalmente que **`SECURITY DEFINER` no bloquea la entrega de eventos Realtime**. La función `create_notification` (SECURITY DEFINER, owner=postgres) inserta en `notifications` y el cambio se replica correctamente vía WAL → Realtime → browser.
>
> Pruebas realizadas desde chrome-devtools navegando como GamerCreativo:
> 1. `INSERT` directo a `notifications` via SQL → evento Realtime recibido ✅
> 2. `SELECT create_notification(...)` via SQL (misma función RPC) → evento Realtime recibido ✅
> 3. Click "Seguir" en perfil de Creativos_Digitales → server action `followUser` → `createNotification` → RPC `create_notification` → INSERT → evento Realtime recibido ✅
>
> **Conclusión**: La teoría de que `SECURITY DEFINER` impedía la entrega de Realtime era incorrecta. Si el sistema de notificaciones Realtime deja de funcionar, buscar causas externas: tabla removida de la publicación, WAL lag, o error de conexión WebSocket.

## Gotchas conocidos

### Tabla no agregada a la publicación Realtime

> [!warning] Gotcha crítico
> La migración `00014_notifications.sql` crea la tabla `notifications` pero **no la agrega** a la publicación `supabase_realtime`. Sin `alter publication supabase_realtime add table notifications;`, Supabase Realtime **no replica ningún cambio** de la tabla, haciendo que el hook y las suscripciones inline reciban 0 eventos.
>
> **Síntoma**: El badge de la campanita nunca se actualiza en vivo. Las notificaciones solo aparecen al recargar la página.
>
> **Causa**: El plan original (`` `docs/raw/plans/2026-07-23-notifications-realtime.md` ``) documenta este paso como manual ("el usuario corre en Dashboard"), y nunca se ejecutó.
>
> **Fix**: Migración `supabase/migrations/00015_enable_realtime_notifications.sql` con el alter publication.
>
> **Prevención futura**: Al crear tablas que necesiten Realtime, incluir el `alter publication` en la misma migración.

### Tabla removida de la publicación Realtime después de haber sido agregada

> [!warning] Gotcha potencial
> Aunque la migración `00015_enable_realtime_notifications.sql` haya agregado `notifications` a la publicación `supabase_realtime`, la tabla **puede desaparecer** de la publicación si se realiza un reset o modificación desde Supabase Dashboard (Database → Replication).
>
> **Síntoma**: Badge de la campanita no se actualiza en vivo. Las notificaciones solo aparecen al recargar la página. El canal Realtime está `SUBSCRIBED` pero nunca llegan eventos INSERT.
>
> **Diagnóstico diferencial**: A diferencia del gotcha anterior ("nunca se agregó"), aquí la migración ya se ejecutó. La tabla pudo haber sido removida al agregar otra tabla a la publicación desde el Dashboard, o por un glitch del servicio.
>
> **Verificación**: Ejecutar en Supabase SQL Editor:
> ```sql
> SELECT pubname, tablename FROM pg_publication_tables
> WHERE pubname = 'supabase_realtime';
> ```
> Debe mostrar `notifications` y `follows`.
>
> **Fix**: Re-agregar la tabla:
> ```sql
> ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
> ```
>
> **Fuente**: `` `docs/raw/debugging/2026-07-23-notifications-realtime-not-delivered.md` ``

### SECURITY DEFINER sin `search_path` explícito

> [!warning] Riesgo de seguridad
> La función `create_notification` en `supabase/migrations/00014_notifications.sql` está definida como `SECURITY DEFINER` pero **no establece `search_path`**. Esto permite que un usuario malintencionado cree objetos en schemas que precedan a `public` en el `search_path`, secuestrando la ejecución de la función.
>
> **Síntoma**: No hay síntoma visible hasta que ocurre un ataque. Es una vulnerabilidad latente.
>
> **Fix**: Agregar `set search_path = public` a la función:
> ```sql
> create or replace function public.create_notification(...)
> returns void
> set search_path = public
> as $$ ... $$ language plpgsql security definer;
> ```
>
> **Fuente**: `` `supabase/migrations/00014_notifications.sql:42` ``

### Datos iniciales del servidor sobreescriben estado Realtime en el hook

> [!warning] Gotcha crítico
> `Navbar.tsx` es un Server Component en el layout que re-renderiza en cada navegación del cliente, pasando nuevos props `initial` a `NavbarClient`. El hook `useRealtimeNotifications` tenía un `useEffect` en `[initial]` que reseteaba `notifications` y `unreadCount` al valor del servidor cada vez que el prop cambiaba. Esto **sobreescribía** el estado que el canal Realtime acababa de actualizar.
>
> **Síntoma**: La suscripción Realtime funciona (SUBSCRIBED status), el `/notificaciones` page recibe eventos en vivo, pero el badge de la campanita en el Navbar **nunca se actualiza** — siempre muestra 0 o el valor del último server render.
>
> **Causa**: Referencia de objeto nueva en cada render del Server Component → `initial !== initialRef.current` era siempre `true` → effect ejecutaba `setNotifications(initial.notifications)` y `setUnreadCount(initial.unreadCount)` → estado Realtime se perdía.
>
> **Fix**: Reemplazado por `didInit.current` flag que solo aplica `initial` en el primer montaje. Los renders subsecuentes del Server Component se ignoran — el estado ya está vivo vía Realtime.
>
> **Prevención futura**: Cuando un Server Component en layout pasa datos a un Client Component con Realtime, el hook debe consumir `initial` solo en mount, nunca en cambios subsecuentes del prop.

## Archivos relacionados

- `lib/notifications.ts` — Helper interno `createNotification`
- `lib/actions/notifications.ts` — Server actions de notificaciones
- `lib/definitions.ts` — Tipos `AppNotification`, `NotificationType`
- `hooks/use-realtime-notifications.ts` — Hook de suscripción Realtime
- `components/Navbar.tsx` — Server component con fetch de notificaciones
- `components/NavbarClient.tsx` — Bell icon + dropdown (con Realtime)
- `app/(protected)/notificaciones/page.tsx` — Página de historial completo (con Realtime)
- `supabase/migrations/00014_notifications.sql` — Migración de tabla + RLS + función
- `docs/raw/plans/2026-07-23-notification-system.md` — Plan de implementación inicial
- `docs/raw/plans/2026-07-23-notifications-realtime.md` — Plan de Realtime
- `docs/raw/plans/2026-07-23-fix-notifications-realtime.md` — Fix: publicación Realtime faltante
- `supabase/migrations/00015_enable_realtime_notifications.sql` — Migración que habilita Realtime en `notifications`
