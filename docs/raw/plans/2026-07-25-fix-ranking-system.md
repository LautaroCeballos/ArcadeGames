# Plan: Fix ranking system (getPlayerLeaderboard FK ambiguity)

## 1. Objetivo
Corregir el ranking de jugadores en la home page que dejó de funcionar. La sección "Top de Jugadores" siempre muestra "Aún no hay estrellas para mostrar un ranking" aunque existan ratings en la base de datos.

## 2. Contexto actual
- Se migró el sistema de rating de 1-5 estrellas a toggle binario (1 estrella = like) en el plan `2026-07-25-rating-to-star-toggle`.
- La función `getPlayerLeaderboard` en `lib/actions/ranking.ts` obtiene juegos aprobados + visibles y agrega ratings por owner.
- El resto del código (en `games.ts`, `search.ts`, `favorites.ts`) usa `profiles!games_user_id_fkey(...)` para joins explícitos.

## 3. Problema
**`getPlayerLeaderboard` falla silenciosamente** por una ambigüedad de FK en Supabase/PostgREST.

La query en `ranking.ts:16` usa:
```ts
.select("id, user_id, profiles!inner(username, avatar_url)")
```

`profiles!inner(...)` no especifica qué constraint de FK usar. Como tanto `games.user_id` como `ratings.user_id` referencian `profiles(id)`, PostgREST detecta múltiples relaciones y devuelve:
```
Error: Could not embed because more than one relationship was found for 'games' and 'profiles'
```

La función captura el error en `if (gamesError || !games || games.length === 0) { return [] }`, retornando vacío silenciosamente.

## 4. Resultado esperado
- `getPlayerLeaderboard` ejecuta la query correctamente.
- La sección "Top de Jugadores" muestra el ranking real de jugadores ordenados por estrellas recibidas.

## 5. Restricciones y supuestos
- Es una corrección de 1 línea.
- El resto del sistema de ratings (toggleStar, getTopRated, getGameById) funciona correctamente (verificado en la respuesta HTTP de la home: "Mejor Valorados" muestra juegos con estrellas).
- `favorites.ts` ya fue corregido (el error de compilación "the name `game` is defined multiple times" era de una versión previa del archivo).

## 6. Dirección visual
- Sin cambios visuales. Solo se corrige el backend del ranking.

## 7. Skills y referencias
- `wiki` — para consultar la documentación del proyecto.
- `tailwind-css-patterns` — no necesario para este fix.

## 8. Arquitectura de implementación
- **Un cambio**: en `lib/actions/ranking.ts:16`, reemplazar `profiles!inner(...)` por `profiles!games_user_id_fkey!inner(...)`.

## 9. Cambios por archivo
| Archivo | Cambio |
|---------|--------|
| `lib/actions/ranking.ts` | Línea 16: `profiles!inner(username, avatar_url)` → `profiles!games_user_id_fkey!inner(username, avatar_url)` |

## 10. Componentes y contratos
- `getPlayerLeaderboard` mantiene su firma: `(limit?: number) => Promise<PlayerRankingEntry[]>`.
- `PlayerRankingEntry` se mantiene igual.
- `RankingSection` y `PodiumCard` no requieren cambios.

## 11. Estados y comportamiento
| Estado | Antes | Después |
|--------|-------|---------|
| Hay ratings en DB | Empty state "Aún no hay estrellas" | Ranking real con jugadores |
| No hay ratings | Empty state "Aún no hay estrellas" | Empty state (correcto) |
| Error de DB | Silencioso (retorna []) | Silencioso (retorna []) — mismo comportamiento |

## 12. Responsive
- Sin cambios.

## 13. Accesibilidad
- Sin cambios.

## 14. Riesgos y mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Que el error no sea solo la FK sino también otro cambio en la migración de rating | Verificar que el resto del sistema (getTopRated) funciona. Ya está verificado. |
| Que el servidor dev tenga caché y no refleje el cambio | Forzar recompilación con `next dev` o reiniciar servidor. |

## 15. Orden de ejecución
1. Corregir `lib/actions/ranking.ts` (1 línea)
2. Forzar recompilación visitando la home en el navegador

## 16. Validación en navegador
- [ ] La home page carga sin errores de servidor
- [ ] "Top de Jugadores" muestra jugadores con estrellas (no el empty state)
- [ ] El podio (top 3) se renderiza correctamente
- [ ] La lista (#4+) se renderiza correctamente

## 17. Criterios de aceptación
- [ ] `getPlayerLeaderboard` retorna jugadores ordenados por estrellas
- [ ] La sección "Top de Jugadores" en la home muestra datos reales
- [ ] No hay errores de compilación ni runtime
