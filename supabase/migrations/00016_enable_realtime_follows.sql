-- Habilita Supabase Realtime en la tabla `follows` para que los contadores
-- de seguidores/siguiendo se actualicen en vivo en los perfiles.
ALTER PUBLICATION supabase_realtime ADD TABLE follows;

-- Fix: resetear el slot de replicación de `notifications` para forzar
-- una reconexión del servicio Realtime. A veces el slot queda stale
-- después de agregar nuevas tablas a la publicación.
ALTER PUBLICATION supabase_realtime DROP TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
