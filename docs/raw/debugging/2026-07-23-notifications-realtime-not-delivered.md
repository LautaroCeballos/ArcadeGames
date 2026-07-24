# Informe de Debugging: Notificaciones Realtime

**Fecha**: 2026-07-23
**Bug**: Las notificaciones dejan de llegar en tiempo real al Navbar después de agregar Realtime a la tabla `follows`

---

## 1. Contexto

Se implementó Realtime para contadores de seguidores/siguiendo en perfiles (`useRealtimeFollowCounts`). Después de esta implementación, las notificaciones en el Navbar dejaron de funcionar en tiempo real.

## 2. Evidencia de los logs

### Browser console
```
[Notifications] subscribing for user: 955db764-...
[FollowCounts] subscribing for profile: 955db764-...
[Notifications] subscribe status: SUBSCRIBED        ✅ WebSocket conectado
[FollowCounts] subscribe status: SUBSCRIBED         ✅ WebSocket conectado
[FollowCounts] INSERT — new follower                ✅ Evento Realtime recibido
```

### Server console
```
[createNotification] Creating: new_follower for user: 955db764-...
[createNotification] Success: new_follower          ✅ RPC exitoso, notificación creada
```

### Lo que FALTA
```
[Notifications] INSERT: ...                         ❌ NUNCA aparece
```

## 3. Análisis

| Componente | Estado | Detalle |
|-----------|--------|---------|
| WebSocket | ✅ | Ambos hooks muestran `SUBSCRIBED` |
| Canal notifications | ✅ | Suscripción activa, filtro correcto |
| Canal follows | ✅ | Recibe INSERT/DELETE correctamente |
| `createNotification` RPC | ✅ | Server log muestra `Success: new_follower` |
| Notificación en DB | ✅ | RPC devolvió success (sin error) |
| Realtime INSERT event | ❌ | El evento INSERT en `notifications` nunca llega al browser |

## 4. Diagnóstico

**La notificación SÍ se crea en la base de datos** (RPC exitoso), pero **el evento INSERT de Realtime no se entrega al cliente**.

Los dos canales Realtime funcionan independientemente:
- `follows-${profileUserId}` → recibe eventos ✅
- `notifications-realtime` → NO recibe eventos ❌

Esto descarta:
- Problema de conexión WebSocket (ambos canales están SUBSCRIBED)
- Problema de código en el hook (el hook no cambió)
- Problema en `createNotification` (el RPC exitoso)

## 5. Causa probable

El problema está en la capa de **Supabase Realtime** para la tabla `notifications`, no en el código de la aplicación.

Posibles causas:
1. **Tabla `notifications` removida de la publicación `supabase_realtime`** — puede haber ocurrido un reset de la configuración de Realtime en Supabase Dashboard
2. **Lag o glitch en Supabase Realtime** — el servicio de Realtime a veces tiene problemas de entrega de eventos
3. **Evento perdido por timing** — la notificación se crea después de `refreshRouter()`, y el evento Realtime se pierde durante la re-renderización

## 6. Próximos pasos

1. **Verificar en Supabase Dashboard** → Editor SQL → ejecutar:
   ```sql
   SELECT pubname, tablename FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```
   Debe mostrar `notifications` y `follows`.

2. **Si falta `notifications`**, ejecutar:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
   ```

3. **Si ambas tablas están en la publicación**, el problema es un glitch de Supabase Realtime. Solución:
   - Supabase Dashboard → Database → Replication → verificar que `notifications` tiene "Enable Realtime" activado
   - O recrear la suscripción: Supabase Dashboard → API → Realtime → verificar que la tabla está habilitada

## 7. Archivos afectados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `hooks/use-realtime-notifications.ts` | Debug logs agregados | Temporal |
| `hooks/use-realtime-follow-counts.ts` | Hook nuevo + debug logs | Nuevo |
| `components/ProfileStats.tsx` | Componente nuevo | Nuevo |
| `components/ProfileHeader.tsx` | Usa ProfileStats | Modificado |
| `lib/notifications.ts` | Debug logs agregados | Temporal |
| `supabase/migrations/00016_enable_realtime_follows.sql` | Habilita Realtime en follows | Nuevo |

## 8. Impacto

- Los contadores de seguidores/siguiendo SÍ se actualizan en tiempo real ✅
- Las notificaciones NO se reciben en tiempo real ❌
- Las notificaciones SÍ aparecen al recargar la página (fetch inicial funciona)
