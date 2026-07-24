---
title: "ArcadePlay — Realtime en Notificaciones"
tags: [feature, notifications, realtime, plan]
last_updated: "2026-07-23"
sources:
  - supabase/migrations/00014_notifications.sql
  - lib/supabase/client.ts
  - lib/definitions.ts
  - components/Navbar.tsx
  - components/NavbarClient.tsx
  - app/(protected)/notificaciones/page.tsx
  - hooks/use-debounce.ts
  - docs/wiki/features/notifications.md
  - docs/raw/plans/2026-07-23-notification-system.md
---

# ArcadePlay — Realtime en Notificaciones

## 1. Objetivo

Agregar suscripciones Realtime de Supabase a las notificaciones para que aparezcan instantáneamente en la UI sin necesidad de recargar la página o esperar la próxima navegación.

## 2. Contexto actual

El sistema de notificaciones funciona con server actions (polling):

- `Navbar.tsx` fetchea `unreadCount` + `recentNotifications(5)` en cada request
- `NavbarClient.tsx` recibe los datos como props estáticas
- `/notificaciones/page.tsx` fetchea su propia data paginada con `getNotifications()`
- Las notificaciones solo se actualizan al navegar entre páginas (server components se re-renderizan)
- No hay delivery en tiempo real al cliente

## 3. Problema

Si el Usuario B sigue al Usuario A desde otra pestaña (o desde la misma pestaña), la notificación:

1. No aparece en el badge de la Navbar hasta recargar la página
2. No aparece en el dropdown del Bell hasta recargar
3. No aparece en `/notificaciones` hasta recargar

Esto rompe la expectativa de feedback instantáneo.

## 4. Resultado esperado

- Al recibir una nueva notificación (INSERT en `notifications`), aparece inmediatamente en:
  - Badge del Bell (contador incrementado)
  - Dropdown del Bell (prependida al inicio)
  - Página `/notificaciones` (prependida al inicio si está abierta)
- Al marcar como leída desde otra pestaña, el badge se actualiza en vivo
- Sin recarga manual ni `router.refresh()` forzado

## 5. Restricciones y supuestos

- El proyecto usa `@supabase/ssr` con `createBrowserClient` para el cliente browser
- Realtime está disponible en el plan actual de Supabase (Free: 200 peak connections, 2M mensajes/mes)
- La tabla `notifications` tiene RLS habilitado y Realtime respeta RLS
- Solo se escuchan eventos INSERT y UPDATE en `notifications`
- El usuario debe estar autenticado para recibir notificaciones
- La suscripción se limpia al desmontar el componente

## 6. Dirección visual

Sin cambios visuales — solo entrega instantánea de los datos existentes.

## 7. Skills y referencias a usar

- **supabase** — patrón de suscripción `postgres_changes` con filtro y cleanup
- **next-best-practices** — Server/Client Component boundaries
- **frontend-design** — revisión general

## 8. Arquitectura de implementación

### Capa nueva: Hook `useRealtimeNotifications`

```
hooks/use-realtime-notifications.ts
```

Hook que:
1. Recibe `userId: string | null`
2. Recibe opcionalmente `initialNotifications` y `initialUnreadCount` (para SSR hydration)
3. Crea canal Realtime con `supabase.channel("notifications")`
4. Escucha INSERT en `notifications` con filtro `user_id=eq.{userId}`
   - Prepend la nueva notificación al estado
   - Incrementa unreadCount
5. Escucha UPDATE en `notifications` con filtro `user_id=eq.{userId}`
   - Si `read` cambió a `true`, decrementa unreadCount
   - Actualiza la notificación en el array local
6. Limpia la suscripción al desmontar (`unsubscribe()`)
7. Retorna `{ notifications, unreadCount }`

### Flujo de datos

```
Supabase DB (INSERT/UPDATE on notifications)
  │
  ▼  (WebSocket via Realtime)
useRealtimeNotifications hook
  │
  ├──▶ NavbarClient: badge count + dropdown
  └──▶ NotificacionesPage: lista en vivo
```

No se modifica la capa de server actions — Realtime es solo una capa de delivery adicional sobre los datos existentes.

## 9. Cambios por archivo

### 9a. SQL — Habilitar Realtime en la tabla

Ejecutar en Supabase Dashboard → SQL Editor:

```sql
alter publication supabase_realtime add table notifications;
```

Esto expone la tabla `notifications` a cambios vía Realtime. RLS sigue protegiendo los datos: cada usuario solo recibe sus propias filas.

### 9b. Crear: `hooks/use-realtime-notifications.ts`

```typescript
// Hook que se suscribe a cambios Realtime en notifications
// - INSERT: prepend + incrementar contador
// - UPDATE: actualizar notificación + decrementar contador si read=true
// Cleanup automático al desmontar
```

### 9c. Modificar: `components/Navbar.tsx`

Agregar `user.id` a las props de `NavbarClient`:

```typescript
// Actual: pasa user, username, role, unreadCount, recentNotifications
// Nuevo: también pasa user.id (como currentUserId)
<NavbarClient
  user={user}
  username={username}
  role={role}
  unreadCount={unreadCount}
  recentNotifications={recentNotifications}
/>
```

### 9d. Modificar: `components/NavbarClient.tsx`

- Agregar `currentUserId` a `NavbarClientProps`
- Usar `useRealtimeNotifications` con `currentUserId` + datos iniciales
- Reemplazar `unreadCount` y `recentNotifications` props por los valores del hook
- **Fix**: eliminar duplicados de `useEffect` (scroll y route change están repetidos, líneas 75-86 y 101-111)

### 9e. Modificar: `app/(protected)/notificaciones/page.tsx`

- Agregar sesión actual (`createBrowserClient` y `supabase.auth.getUser()`)
- Usar `useRealtimeNotifications` para recibir notificaciones en vivo
- Las nuevas notificaciones se prependen a la lista
- Los UPDATE de `read` se reflejan instantáneamente

### 9f. Modificar: `docs/wiki/features/notifications.md`

- Actualizar "Sin Realtime" → "Con Realtime: delivery instantáneo"
- Agregar sección de Realtime

### 9g. Modificar: `docs/wiki/log.md`

- Agregar entry de esta implementación

## 10. Componentes y contratos

### `useRealtimeNotifications(userId, initial?)`

```typescript
function useRealtimeNotifications(
  userId: string | null,
  initial?: {
    notifications: AppNotification[]
    unreadCount: number
  }
): {
  notifications: AppNotification[]
  unreadCount: number
}
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `userId` | `string \| null` | — | ID del usuario autenticado, null = no suscribirse |
| `initial` | `{ notifications, unreadCount }?` | `undefined` | Datos iniciales para hydration SSR |

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `notifications` | `AppNotification[]` | Lista actualizada de notificaciones (más reciente primero) |
| `unreadCount` | `number` | Contador de no leídas actualizado en vivo |

### NavbarClient props (actualizadas)

```typescript
interface NavbarClientProps {
  user: { id: string; email?: string | null } | null
  username: string | null
  role: 'user' | 'moderator' | 'admin'
  unreadCount?: number        // → ahora es semilla inicial
  recentNotifications?: AppNotification[]  // → ahora es semilla inicial
}
```

## 11. Estados y comportamiento

| Estado | Comportamiento |
|--------|---------------|
| `userId = null` (no auth) | Hook no se suscribe, retorna vacío |
| Carga inicial | Usa datos del servidor como semilla |
| Nueva notificación (INSERT) | Aparece al tope, badge se incrementa |
| Marcar como leída (UPDATE) | Badge decrementa, dot azul desaparece |
| Desmontar componente | Canal se limpia (`unsubscribe()`) |
| Error de conexión Realtime | Reconección automática (manejo interno de Supabase) |
| Múltiples pestañas | Todas reciben el evento simultáneamente |

## 12. Responsive

Sin cambios — la UI existente ya es responsive.

## 13. Accesibilidad

- Las notificaciones se anuncian visualmente (ya existente)
- No se agregan elementos interactivos nuevos
- Los cambios en vivo no interfieren con lectores de pantalla (no hay anuncios automáticos)

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Realtime consume conexiones del plan Free | ArcadePlay tiene pocos usuarios concurrentes (< 200). Si crece, escalar a Pro ($25/mes, 500 conexiones) |
| Fuga de memoria por no limpiar canal | `useEffect` return `() => supabase.removeChannel(channel)` |
| Datos duplicados por evento Realtime + server data | El hook usa los datos iniciales como semilla y solo prepend nuevos INSERT; el servidor sigue siendo la fuente de verdad |
| Cliente sin WebSocket | `createBrowserClient` maneja fallback a polling |

## 15. Orden de ejecución

1. ✅ **(ya hecho)** Migración `00014_notifications.sql` aplicada
2. **SQL**: Habilitar Realtime: `alter publication supabase_realtime add table notifications;` (usuario corre en Dashboard)
3. **Hook**: Crear `hooks/use-realtime-notifications.ts`
4. **NavbarClient**: Integrar hook + limpiar useEffects duplicados
5. **Notificaciones page**: Integrar hook para lista en vivo
6. `npm run build`
7. **Testear**: Seguir usuario → notificación aparece instantáneamente en el badge
8. **Wiki**: Actualizar `features/notifications.md` y `log.md`

## 16. Validación en navegador

1. Iniciar sesión con User A, abrir `/notificaciones`
2. En otra pestaña/ventana/incógnito, iniciar sesión con User B
3. User B sigue a User A
4. **Esperado**: En la pestaña de User A, el badge del Bell se incrementa y la notificación aparece en el dropdown
5. Abrir dropdown, hacer clic → se marca como leída → badge decrementa
6. En `/notificaciones` de User A, la notificación aparece al tope
7. Marcar todas leídas → badge a 0
8. Cerrar sesión → hook deja de escuchar (no hay fugas)

## 17. Criterios de aceptación

- [ ] SQL ejecutado (notifications agregada a `supabase_realtime`)
- [ ] `hooks/use-realtime-notifications.ts` creado con suscripción INSERT + UPDATE + cleanup
- [ ] `NavbarClient.tsx` actualizado: badge y dropdown se actualizan en vivo
- [ ] `NavbarClient.tsx`: se eliminan los useEffects duplicados (scroll y route change)
- [ ] `NotificacionesPage.tsx`: lista se actualiza en vivo
- [ ] `npm run build` exitoso (0 errores TS)
- [ ] Wiki actualizada
- [ ] Prueba de hum humo: seguir a un usuario → notificación aparece sin recargar
