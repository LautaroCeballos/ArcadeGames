---
title: "ArcadePlay — Sistema de Moderación"
tags: [feature, moderacion, admin]
last_updated: "2026-07-21"
sources:
  - supabase/migrations/00010_moderator_role.sql
  - supabase/migrations/00011_rejection_reason.sql
  - supabase/migrations/00012_admin_update_profiles.sql
  - supabase/migrations/00013_draft_status.sql
  - lib/actions/games.ts
  - components/ModeratorGameActions.tsx
  - app/(protected)/moderar/page.tsx
  - app/(protected)/admin/usuarios/page.tsx
  - components/ProfileGameCard.tsx
---

# ArcadePlay — Sistema de Moderación

## Concepto

Los juegos nuevos se crean con `status: 'pending'`. Un moderador debe aprobarlos para que sean visibles al público. El sistema distingue tres roles:

| Rol | Permisos |
|-----|----------|
| `user` | Rol por defecto. Sin permisos especiales. |
| `moderator` | Puede aprobar/rechazar/editar/eliminar cualquier juego. Ve juegos pendientes en el panel de moderación y en perfiles. |
| `admin` | Todos los permisos de moderador + puede asignar/quitar roles de moderador a otros usuarios. |

## Borradores

El desarrollador puede optar por guardar un juego como **borrador** (`status: 'draft'`) en lugar de publicarlo directamente. Los borradores:

- Solo son visibles para el desarrollador (en su perfil y dashboard)
- Tienen badge "Borrador" (gris)
- No aparecen en listados públicos ni en el panel de moderación
- No otorgan badges
- Se pueden editar sin cambiar su estado (siguen siendo draft)
- Desde el perfil o dashboard, el desarrollador puede hacer clic en **"Publicar"** para enviarlo a moderación (`status → 'pending'`)

## Flujo de moderación

1. Usuario sube un juego → `createGame` lo crea con `status: 'pending'` (o `'draft'` si elige guardar borrador)
2. El juego aparece en el perfil del dueño con badge "En moderación" (o "Borrador")
3. El juego aparece en el panel `/moderar` para moderadores y admins (excepto borradores)
4. El moderador puede:
   - **Aprobar**: cambia `status` a `'approved'` → el juego se vuelve público
   - **Rechazar**: cambia `status` a `'rejected'`. Opcionalmente puede agregar un **motivo de rechazo** visible para el desarrollador
   - **Volver a pendiente**: desde la pestaña "Aprobados", mueve el juego de vuelta a `pending`
   - **Eliminar**: borra el juego permanentemente
5. Los juegos aprobados también pueden ocultarse/mostrarse desde el panel de moderación

## Motivo de rechazo

Cuando un moderador hace clic en "Rechazar", se abre un diálogo modal con un textarea donde puede escribir el motivo (opcional). El motivo se guarda en la columna `rejection_reason` de `games` (ver `00011_rejection_reason.sql`).

El motivo se muestra en:
- La card del juego en el panel de moderación (etiqueta roja con "Motivo: ...")
- El perfil del desarrollador, debajo del juego rechazado con `ProfileGameCard` (`components/ProfileGameCard.tsx`)
- Edit game page (pendiente)

Si el moderador luego aprueba o vuelve a pendiente el juego, el `rejection_reason` se limpia automáticamente.

## Panel de moderación (`/moderar`)

- Solo accesible por usuarios con rol `moderator` o `admin`
- Pestañas: Pendientes | Aprobados | Rechazados | Todos
- Cada juego muestra: thumbnail, título, autor, tags, badge de estado, y motivo de rechazo si aplica
- Acciones: Aprobar, Rechazar (con diálogo de motivo), Volver a pendiente, Ocultar/Mostrar, Eliminar
- Ver `app/(protected)/moderar/moderator-dashboard.tsx`

## Administración de usuarios (`/admin/usuarios`)

- Solo accesible por usuarios con rol `admin`
- Tabla de todos los usuarios con búsqueda por username/email
- Selector de rol por usuario (Usuario / Moderador / Admin)
- Ver `app/(protected)/admin/usuarios/admin-users-client.tsx`

## Acciones de moderador en perfil

Cuando un moderador/admin visita el perfil de otro usuario, ve **todos** los juegos (incluyendo pendientes, rechazados y ocultos). Cada juego muestra botones de acción:

- **Pendiente**: botón Aprobar (check verde) + Rechazar (X rojo)
- **Aprobado**: botón Eliminar (tacho rojo)
- **Rechazado**: botón Eliminar (tacho rojo)

Ver `components/ModeratorGameActions.tsx`.

## Server Actions

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| `getPendingGames(page, limit)` | `lib/actions/games.ts:570` | Lista juegos con `status = 'pending'` (moderador) |
| `getModeratedGames({status})` | `lib/actions/games.ts:609` | Lista juegos filtrados por status (moderador) |
| `approveGame(gameId)` | `lib/actions/games.ts:657` | Cambia status a `'approved'` |
| `rejectGame(gameId, reason?)` | `lib/actions/games.ts:674` | Cambia status a `'rejected'` con motivo opcional |
| `publishGame(gameId)` | `lib/actions/games.ts` | Publica un borrador → lo envía a `'pending'` para moderación (desarrollador) |
| `revertToPending(gameId)` | `lib/actions/games.ts:688` | Vuelve un juego aprobado a `'pending'`, limpia `rejection_reason` |
| `modToggleVisibility(gameId)` | `lib/actions/games.ts:698` | Oculta/muestra cualquier juego |
| `modDeleteGame(gameId)` | `lib/actions/games.ts:722` | Elimina cualquier juego |
| `getUsers({search})` | `lib/actions/games.ts:733` | Lista usuarios con búsqueda (admin) |
| `setUserRole(userId, role)` | `lib/actions/games.ts:756` | Cambia rol de un usuario (admin) |

## RLS

Las políticas de la migración `00010` permiten que los moderadores/admins hagan SELECT, UPDATE y DELETE sobre cualquier juego, sin restricción de `user_id`. Ver [[database/schema]].
