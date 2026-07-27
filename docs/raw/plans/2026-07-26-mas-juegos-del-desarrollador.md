# Más juegos del desarrollador en página de juego

## 1. Objetivo
Agregar una sección "Más juegos de [usuario]" debajo del embed y metadata en la página `/juego/[id]`, mostrando otros juegos aprobados y visibles del mismo desarrollador.

## 2. Contexto actual
La página `/juego/[id]` (`app/(public)/juego/[id]/page.tsx`) tiene dos columnas en desktop: izquierda (embed sticky) y derecha (título, badges, descripción, rating, favoritos, juegos relacionados por tag). No hay sección de "más del mismo desarrollador".

## 3. Problema
El usuario que juega un juego no tiene forma de descubrir otros juegos del mismo creador desde la página de detalle.

## 4. Resultado esperado
- Una sección horizontal con thumbnails de otros juegos del mismo desarrollador debajo del embed/metadata
- Título: "Más juegos de [username]"
- Máximo 6 juegos en horizontal scroll (similar a las secciones del home)
- Solo juegos `approved` + `hidden=false`
- Excluye el juego actual
- Si no hay más juegos del desarrollador, la sección no se muestra

## 5. Restricciones y supuestos
- `game.user_id` está disponible en el page data
- Se usará la query directa a Supabase (sin server action, es Server Component)
- `GameThumbnail` existe y sirve para esta sección (acepta `GameThumbnailData`)
- El username del desarrollador se obtiene de `game.profiles.username`

## 6. Dirección visual
- Separador horizontal antes de la sección
- Título: "Más juegos de [username]" con link al perfil
- Horizontal scroll de `GameThumbnail` (251px cada card, 8px gap)
- Scroll-x con `overflow-x-auto` y `scrollbar-hidden`

## 7. Skills y referencias a usar
- `docs/wiki/frontend/components.md` — componentes existentes
- `lib/queries/games.ts` — queries de lectura

## 8. Arquitectura de implementación
1. Agregar `getGamesByAuthor()` en `lib/queries/games.ts`
   - Recibe: `userId: string`, `excludeGameId: string`, `limit?: number`
   - Retorna: `GameThumbnailData[]` (array de `{ id, title, thumbnail_url, stars_count }`)
   - Filtra: `status = "approved"`, `hidden = false`, `user_id = userId`
   - Excluye: `id != excludeGameId`
   - Orden: `created_at desc`
   - Cuenta estrellas para cada juego
2. En `app/(public)/juego/[id]/page.tsx`:
   - Importar `getGamesByAuthor`
   - Hacer fetch después de `getGameById`
   - Renderizar sección debajo del `</div>` del grid
3. No crear nuevos componentes — reutilizar `GameThumbnail`

## 9. Cambios por archivo

### `lib/queries/games.ts`
- Agregar función `getGamesByAuthor`
- Mismo patrón que `getRecentGames` pero filtrado por `user_id`

### `app/(public)/juego/[id]/page.tsx`
- Importar `getGamesByAuthor`
- Agregar fetch: `const authorGames = await getGamesByAuthor(game.user_id, game.id, 6)`
- Agregar sección JSX condicional debajo del cierre del grid

## 10. Componentes y contratos
- `GameThumbnail` acepta `game: GameThumbnailData`
- `GameThumbnailData`: `{ id, title, thumbnail_url, stars_count, author?, platform? }`
- No se requieren cambios en componentes existentes

## 11. Estados y comportamiento
| Estado | Comportamiento |
|--------|---------------|
| 0 juegos del autor además del actual | No se renderiza nada |
| 1-6 juegos | Sección horizontal, sin scroll (caben todas visibles) |
| 6+ juegos | Scroll horizontal con overflow-x-auto |

## 12. Responsive
- Mobile: misma sección debajo del embed, scroll horizontal
- Desktop: debajo de las dos columnas, scroll horizontal
- Mismo comportamiento en todos los tamaños (horizontal scroll)

## 13. Accesibilidad
- Link al perfil del desarrollador en el título de la sección
- Cada thumbnail es un link a su juego
- `aria-label` descriptivo si es necesario

## 14. Riesgos y mitigaciones
- Riesgo: query lenta si el autor tiene muchos juegos. Mitigación: `LIMIT 6`, query simple sin joins pesados.
- Riesgo: que `getGamesByAuthor` duplique lógica de `getRecentGames`. Mitigación: aceptable por claridad; no hay repetición significativa.

## 15. Orden de ejecución
1. Agregar `getGamesByAuthor` en `lib/queries/games.ts`
2. Modificar `app/(public)/juego/[id]/page.tsx`
3. Build y validación

## 16. Validación en navegador
- Desktop: sección visible debajo del embed
- Mobile: scroll horizontal funciona
- Sin juegos adicionales del autor: sección oculta
- Link al perfil del desarrollador funcional
- Cada thumbnail linkea a `/juego/[id]`
- Build sin errores

## 17. Criterios de aceptación
- [ ] Sección "Más juegos de [username]" visible debajo del embed+metadata
- [ ] Máximo 6 juegos mostrados
- [ ] Horizontal scroll si excede el ancho
- [ ] Sección oculta si el autor no tiene otros juegos
- [ ] Build pasa sin errores
