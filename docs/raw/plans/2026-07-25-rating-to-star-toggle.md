# Plan: Convertir sistema de puntaje 1-5 a toggle de 1 estrella

## 1. Objetivo
Reemplazar el sistema de rating actual (1 a 5 estrellas por jugador por juego) por un sistema binario de "like": cada jugador solo puede dar **1 estrella** por juego, y puede removerla (toggle). El concepto de `avg_rating` (promedio 1-5) desaparece; en su lugar se muestra el **conteo de estrellas** (cantidad de personas que dieron like).

## 2. Contexto actual
- Tabla `ratings` con columna `value INTEGER CHECK (value >= 1 AND value <= 5)` y `UNIQUE (game_id, user_id)`.
- Server action `rateGame(gameId, value)` hace upsert con valor 1-5.
- Se muestra `avg_rating` como promedio con decimal, y `user_rating` como valor 1-5 o null.
- `total_stars` en perfiles = suma de todos los `value` (puede ser > cantidad de ratings).
- `getTopRated()` ordena por promedio descendente.
- Badges: "Primera Estrella" (1+), "50 Estrellas" (50+), "100 Estrellas" (100+) basados en suma.
- Componente `Rating.tsx`: 5 estrellas interactivas con hover/select.

## 3. Problema
El sistema 1-5 es complejo y no se alinea con la mecánica simple de "me gusta" que se desea. Cada jugador valora un juego con 1 estrella o ninguna, sin granularidad.

## 4. Resultado esperado
- Botón de estrella única toggle: si el usuario ya dio estrella, la puede remover; si no, la puede agregar.
- En lugar de `avg_rating`, se muestra **cantidad de estrellas** recibidas.
- `user_rating` se reemplaza por `has_starred: boolean`.
- Ranking, perfil y top-rated se basan en **conteo** de estrellas.
- Badges de estrellas siguen funcionando (cada rating = 1 estrella).
- Migración de DB: todos los ratings existentes se normalizan a value=1, y el CHECK cambia a `value = 1`.

## 5. Restricciones y supuestos
- No cambiar estructura de tablas (solo constraint y migration).
- Ya existe UNIQUE(game_id, user_id) — no se necesita cambio.
- No podemos borrar la columna `value` porque el tipo Rating la usa; la mantenemos pero siempre con valor 1.
- La notificación debe actualizar el texto: "le dio una estrella" en lugar de "le dio X estrellas".
- Toggle: si el usuario ya votó, se borra el rating; si no, se inserta con value=1.

## 6. Dirección visual
- Componente `Rating` rediseñado: una sola estrella grande, clickeable.
  - Sin estrella → contorno gris. Al clickear: se llena de amarillo (estrella dada).
  - Con estrella → llena amarilla. Al clickear: se vacía (estrella removida).
- Texto: "X estrellas" (conteo) en lugar de "Promedio: X / 5".
- En cards y thumbnails: mostrar el conteo de estrellas en lugar del promedio.

## 7. Skills y referencias a usar
- `next-best-practices` — para server actions y revalidation.
- `tailwind-css-patterns` — para estilos del nuevo componente toggle.
- `supabase` — para la migración y consultas DB.

## 8. Arquitectura de implementación

### DB
- Nueva migración `00022_ratings_star_toggle.sql`:
  1. Normalizar todos los ratings existentes: `UPDATE ratings SET value = 1`
  2. Cambiar CHECK: `ALTER TABLE ratings DROP CONSTRAINT ...; ADD CONSTRAINT ... CHECK (value = 1)`

### Server Actions
- `rateGame(gameId, value)` → **`toggleStar(gameId)`**: sin parámetro value.
  - Si existe rating: DELETE (un-star).
  - Si no existe: INSERT con value=1 (star).
  - Notificación solo cuando se AGREGA estrella (no al remover).
  - Texto de notificación: `"${username} le dio una estrella a tu juego"`.
- `getGameById`: `avg_rating` → `stars_count` (conteo). `user_rating` → `has_starred` (boolean).
- `getTopRated`: ordenar por COUNT de ratings descendente.
- `getProfileByUsername`: `total_stars` = COUNT de ratings (ya no suma). `avg_rating` eliminado.
- `getPlayerLeaderboard`: `totalStars` = COUNT de ratings (ya no suma).
- `checkAndAwardBadges`: badges de estrellas siguen igual (cada rating = 1, la suma = conteo).

### Types
- `GameWithDetails.avg_rating` → se reemplaza semánticamente. Se mantiene el nombre `avg_rating` como `number | null` para no romper todos los componentes de una, pero en runtime será el **conteo**.
- Opción más limpia: renombrar a `stars_count`, `has_starred`.
- Decisión: **renombrar** para claridad semántica:
  - `GameWithDetails.avg_rating` → `stars_count: number | null`
  - `GameWithDetails.user_rating` → `has_starred: boolean | null`
  - `ProfileWithStats.avg_rating` → eliminar (no tiene sentido)
- `PlayerRankingEntry.totalStars` se mantiene (ahora es conteo, no suma).

### UI Components
- `Rating.tsx`: rediseño completo a toggle de 1 estrella.
- `GameCard.tsx`: `stars_count` en lugar de `avg_rating`.
- `GameThumbnail.tsx`: `stars_count` en lugar de `avg_rating`.
- `GameThumbnailData`: `avg_rating` → `stars_count`.
- `DashboardCard.tsx`: `stars_count` en lugar de `avg_rating`.
- `ProfileGameCard.tsx`: `stars_count` en lugar de `avg_rating`.
- `ProfileStats.tsx`: sin cambios (solo muestra `totalStars`).
- `PodiumCard.tsx`: sin cambios (solo muestra `totalStars`).
- `RankingSection.tsx`: texto de empty state actualizado.
- `NavbarClient.tsx`: sin cambios (solo icono).

### Pages
- `juego/[id]/page.tsx`: pasar `starsCount` y `hasStarred` al Rating.
- `perfil/[username]/page.tsx`: `avg_rating` → `stars_count` en el mapeo.
- `page.tsx` (home): sin cambios (solo llama a getTopRated).

## 9. Cambios por archivo

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/00022_ratings_star_toggle.sql` | **NUEVO**: normalizar ratings + cambiar CHECK |
| `lib/definitions.ts` | `Rating.value` semántica; `GameWithDetails.avg_rating`→`stars_count`, `user_rating`→`has_starred`; eliminar `ProfileWithStats.avg_rating` |
| `lib/actions/ratings.ts` | `rateGame(gameId, value)` → `toggleStar(gameId)`. Sin value. Toggle delete/insert. Notificación actualizada. |
| `lib/actions/games.ts` | `getGameById`: stars_count (COUNT) + has_starred (BOOLEAN). `getTopRated`: sort by count. `GameThumbnailData` type update. |
| `lib/actions/profile.ts` | `total_stars` = ratings count. Eliminar `avg_rating`. |
| `lib/actions/ranking.ts` | `totalStars` = ratings count (value siempre 1, no cambia lógica). |
| `lib/actions/badges.ts` | Sin cambios lógicos (suma de valores 1 = conteo). |
| `components/Rating.tsx` | **Reescritura completa**: toggle de 1 estrella. |
| `components/GameCard.tsx` | `stars_count` en lugar de `avg_rating`. |
| `components/GameThumbnail.tsx` | `stars_count` en lugar de `avg_rating`. Interface actualizada. |
| `components/CuratedSection.tsx` | Usa `GameThumbnailData` actualizado. |
| `components/DashboardCard.tsx` | `stars_count` en lugar de `avg_rating`. |
| `components/ProfileGameCard.tsx` | `stars_count` en lugar de `avg_rating`. |
| `app/(public)/juego/[id]/page.tsx` | Props actualizadas para Rating. |
| `app/(public)/perfil/[username]/page.tsx` | `avg_rating` → `stars_count`. |
| `lib/notifications.ts` | Sin cambios (solo cambia el mensaje en caller). |

## 10. Componentes y contratos

### `Rating` (props)
```ts
interface RatingProps {
  gameId: string
  starsCount: number | null
  hasStarred: boolean | null  // null = not authenticated
}
```

### `GameThumbnailData`
```ts
interface GameThumbnailData {
  id: string
  title: string
  thumbnail_url: string | null
  stars_count: number | null
}
```

### `GameWithDetails` (cambios)
```ts
type GameWithDetails = Game & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null
  tags: Tag[]
  stars_count: number | null    // antes avg_rating
  has_starred: boolean | null   // antes user_rating
}
```

### `ProfileWithStats` (cambios)
```ts
interface ProfileWithStats extends Profile {
  total_games: number
  total_stars: number
  // avg_rating ELIMINADO
  followers_count: number
  following_count: number
  badges: (UserBadge & { badges: Badge })[]
}
```

## 11. Estados y comportamiento

### Rating toggle
| Estado | Visual | Acción |
|--------|--------|--------|
| No autenticado | Estrella gris contorno, no clickeable | Mensaje: "Inicia sesión para votar" |
| No votado | Estrella gris contorno, clickeable | Click → llama toggleStar → estrella amarilla |
| Votado | Estrella amarilla llena, clickeable | Click → llama toggleStar → estrella gris contorno |
| Loading | Estrella con opacidad reducida + spinner | - |

### Empty states
- RankingSection: "Aún no hay estrellas para mostrar un ranking."
- TopRatedSection: si ningún juego tiene estrellas, no se muestra la sección (ya implementado con filter).

## 12. Responsive
- El botón de estrella única es inherentemente responsive (un solo elemento).
- En mobile, el tamaño del botón debe ser igual de clickeable (min 44x44px).
- En cards/thumbnails, el conteo de estrellas se muestra igual que antes (ícono + número).

## 13. Accesibilidad
- El botón toggle debe tener `aria-label` dinámico: "Dar estrella" / "Quitar estrella".
- `aria-pressed` para indicar estado toggle.
- Soporte de teclado: Enter/Espacio para toggle.
- Contraste suficiente en el ícono de estrella contra el fondo.

## 14. Riesgos y mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Datos existentes con valores 2-5 se pierden | Migración los normaliza a 1. Es un cambio de sistema, se acepta. |
| Componentes que usan avg_rating se rompen | Actualizar todos los consumidores en el mismo PR. |
| `total_stars` en badges cambia semántica (suma vs conteo) | Como value=1 siempre, suma = conteo. No hay cambio real. |
| Notificación se envía al hacer toggle off | Solo enviar notificación cuando se AGREGA estrella (antes del insert), no al remover. |

## 15. Orden de ejecución
1. Migración DB (`00022_ratings_star_toggle.sql`)
2. `lib/definitions.ts` — actualizar tipos
3. `lib/actions/ratings.ts` — reescribir a toggleStar
4. `lib/actions/profile.ts` — actualizar cómputos
5. `lib/actions/games.ts` — actualizar getGameById, getTopRated, GameThumbnailData
6. `components/Rating.tsx` — reescribir componente
7. `components/GameThumbnail.tsx` — actualizar interface y visual
8. `components/GameCard.tsx` — actualizar visual
9. `components/DashboardCard.tsx` — actualizar visual
10. `components/ProfileGameCard.tsx` — actualizar visual
11. Pages: `juego/[id]/page.tsx`, `perfil/[username]/page.tsx`
12. `lib/actions/ranking.ts` — verificar lógica (sin cambios reales)
13. `lib/actions/badges.ts` — verificar lógica (sin cambios reales)
14. Revisar estado compilación y corregir errores

## 16. Validación en navegador
- [ ] La página de juego muestra estrella única toggle
- [ ] Usuario no autenticado ve estrella deshabilitada
- [ ] Click en estrella (no votado) → se llena + notificación
- [ ] Click en estrella (votado) → se vacía (sin notificación)
- [ ] Conteo de estrellas se actualiza tras toggle
- [ ] Cards/thumbnails en homepage muestran conteo
- [ ] Perfil muestra total_stars correcto
- [ ] Ranking ordena por estrellas correctamente
- [ ] Sección "Mejor Valorados" ordena por estrellas
- [ ] Notificación "Nueva estrella" aparece con texto correcto
- [ ] Responsive: botón funciona en 375px+
- [ ] Sin errores de compilación ni runtime

## 17. Criterios de aceptación
- [ ] No existe más el concepto de rating 1-5 en el código
- [ ] Cada jugador puede dar 1 estrella por juego (toggle on/off)
- [ ] `avg_rating` y `user_rating` reemplazados por `stars_count` y `has_starred`
- [ ] Todos los componentes consumidores actualizados
- [ ] Migración DB aplicable y ratings existentes normalizados a 1
- [ ] Notificación actualizada: "le dio una estrella a tu juego"
- [ ] Ranking y top-rated usan conteo de estrellas
- [ ] Compilación TypeScript exitosa
