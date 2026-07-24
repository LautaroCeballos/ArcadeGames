---
title: "ArcadePlay — Fix: Realtime en Notificaciones no funciona en Header"
tags: [feature, notifications, realtime, fix, plan]
last_updated: "2026-07-23"
sources:
  - supabase/migrations/00014_notifications.sql
  - hooks/use-realtime-notifications.ts
  - components/NavbarClient.tsx
  - app/(protected)/notificaciones/page.tsx
  - docs/wiki/features/notifications.md
  - docs/raw/plans/2026-07-23-notifications-realtime.md
---

# ArcadePlay — Fix: Realtime en Notificaciones no funciona en Header

## 1. Objetivo

Solucionar que las notificaciones no lleguen en tiempo real al header (campanita en Navbar) a pesar de que en `/notificaciones` sí funcionan.

## 2. Contexto actual

- El hook `useRealtimeNotifications` y la suscripción inline en `notificaciones/page.tsx` están correctamente implementados
- Ambos se suscriben a `postgres_changes` en la tabla `notifications` con filtro `user_id=eq.{userId}`
- La migración `00014_notifications.sql` creó la tabla, RLS y la función `create_notification`

## 3. Problema

**Causa raíz**: La migración `00014_notifications.sql` **no incluye** la línea que agrega la tabla `notifications` a la publicación `supabase_realtime`:

```sql
alter publication supabase_realtime add table notifications;
```

Sin esto, Supabase Realtime **no replica ningún cambio** de la tabla `notifications` a través del WebSocket. Los eventos INSERT y UPDATE nunca llegan al cliente.

Esto afecta tanto a:
- El header (`NavbarClient` → hook `useRealtimeNotifications`)
- La página `/notificaciones` (suscripción inline)

**¿Por qué el usuario dice que en `/notificaciones` sí funciona?** Porque la página `/notificaciones` recarga datos al montarse (`getNotifications`), pero las notificaciones nuevas no llegan en vivo por Realtime — solo aparecen al recargar la página. El usuario probablemente confundió el fetch inicial con Realtime.

En el header, el hook recibe `currentUserId` correctamente, pero como la publicación no incluye la tabla, el canal nunca recibe eventos. El badge y dropdown se quedan con los datos iniciales del servidor.

## 4. Resultado esperado

- Al crear una notificación (INSERT), aparece instantáneamente en el badge y dropdown del header
- Al marcar como leída (UPDATE), el badge se actualiza sin recargar
- Lo mismo aplica para la página `/notificaciones`

## 5. Restricciones y supuestos

- La publicación `supabase_realtime` ya existe (creada por defecto en proyectos Supabase)
- Solo falta agregar la tabla `notifications` a dicha publicación
- RLS sigue protegiendo los datos — cada usuario recibe solo sus filas
- El plan Free de Supabase soporta Realtime (200 conexiones simultáneas)

## 6. Dirección visual

Sin cambios visuales — solo corrección de conectividad Realtime.

## 7. Skills y referencias a usar

- **supabase** — patrón de Realtime publication

## 8. Arquitectura de implementación

### Fix único: Migración SQL

Crear migración `00015_enable_realtime_notifications.sql` con:

```sql
alter publication supabase_realtime add table notifications;
```

## 9. Cambios por archivo

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/00015_enable_realtime_notifications.sql` | **Crear**: agregar `notifications` a `supabase_realtime` |
| `docs/wiki/features/notifications.md` | **Actualizar**: documentar el paso faltante como gotcha |
| `docs/wiki/log.md` | **Actualizar**: registrar el fix |

## 10-13. Componentes, estados, responsive, accesibilidad

Sin cambios — solo una línea SQL.

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| La publicación `supabase_realtime` no existe | Crearla: `create publication supabase_realtime;` antes del alter |
| Otras tablas ya están en la publicación | `alter publication supabase_realtime add table notifications;` es aditivo, no destructivo |
| Realtime incrementa uso del plan Free | ArcadePlay tiene pocos usuarios concurrentes. Si crece, escalar a Pro |

## 15. Orden de ejecución

1. Crear migración `00015_enable_realtime_notifications.sql`
2. Aplicar migración via `supabase migration up`
3. Verificar con logs del navegador que el canal recibe eventos `SUBSCRIBED`
4. Probar: User A sigue a User B → notificación aparece instantáneamente en el header de User B
5. Actualizar wiki

## 16. Validación en navegador

1. Abrir DevTools → Console, filtrar por `[Realtime`
2. Verificar que `subscribe status: SUBSCRIBED` aparece para el canal `notifications-realtime`
3. En otra ventana/incógnito, User B sigue a User A
4. En la ventana de User A: el badge del Bell debe incrementarse instantáneamente
5. Abrir dropdown: la notificación debe aparecer al inicio
6. También verificar en `/notificaciones`: la notificación debe aparecer sin recargar

## 17. Criterios de aceptación

- [ ] Migración `00015_enable_realtime_notifications.sql` creada y aplicada
- [ ] `[Realtime Hook] subscribe status: SUBSCRIBED` visible en console
- [ ] Notificación aparece en el badge del header sin recargar
- [ ] Notificación aparece en `/notificaciones` sin recargar
- [ ] `npm run build` exitoso
- [ ] Wiki actualizada con el gotcha de la publicación Realtime
