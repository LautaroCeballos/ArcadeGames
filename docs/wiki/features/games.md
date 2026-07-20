---
title: "ArcadePlay — Sistema de Juegos"
tags: [feature, games]
last_updated: "2026-07-20"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - docs/raw/plans/2026-07-20-submit-form-dual-platform.md
  - docs/raw/plans/2026-07-20-submit-form-tags-redesign.md
---

# ArcadePlay — Sistema de Juegos

## Concepto

Los juegos no se suben al servidor. Se referencian mediante su URL de **MakeCode Arcade** o **Scratch**. La plataforma se persiste en la columna `platform` de la tabla `games`.

## Plataformas soportadas

### MakeCode Arcade

| Formato | Ejemplo | ID extraído |
|---------|---------|-------------|
| `arcade.makecode.com/---run?id=...` | `https://arcade.makecode.com/---run?id=_HdY0sobLD4zd` | `_HdY0sobLD4zd` |
| `makecode.com/_...` | `https://makecode.com/_ViYEarFuVgC8` | `_ViYEarFuVgC8` |
| `arcade.makecode.com/...` (path) | `https://arcade.makecode.com/66795-36651-40272-92516` | `66795-36651-40272-92516` |

**Funciones**: `extractGameId()`, `buildEmbedUrl()`, `isValidMakeCodeUrl()` en `lib/game-utils.ts`.

La URL de embed se construye como `https://arcade.makecode.com/---run?id={ID}`.

### Scratch

| Formato | Ejemplo | ID extraído |
|---------|---------|-------------|
| `scratch.mit.edu/projects/{id}` | `https://scratch.mit.edu/projects/617923907` | `scratch_617923907` |

**Funciones**: `extractScratchId()`, `buildScratchEmbedUrl()`, `isValidScratchUrl()` en `lib/game-utils.ts`.

La URL de embed se construye como `https://scratch.mit.edu/projects/{ID}/embed`.

> [!note] Los IDs de Scratch se almacenan con prefijo `scratch_` (ej. `scratch_617923907`) para evitar colisiones con IDs de MakeCode.

## Identificador

- **MakeCode**: El ID se extrae con `extractGameId()` de la URL. Soporta 3 formatos (query param `?id=`, path en `makecode.com`, path en `arcade.makecode.com`).
- **Scratch**: El ID se extrae con `extractScratchId()` de la URL. El formato es `scratch.mit.edu/projects/{numeric_id}`.
- **Detección automática**: `extractGamePlatform()` detecta la plataforma según el hostname de la URL.

## Tags (sistema de categorías múltiples)

> [!done] Implementado. Las categorías únicas fueron reemplazadas por **tags** (sistema many-to-many). Se eliminaron `categories` y `games.category_id` en favor de `tags` y `game_tags`.

Las tags se seedearon desde las categorías originales (10) más las tags de plataforma "MakeCode Arcade" y "Scratch":

| Tag | Tipo | Color |
|-----|------|-------|
| MakeCode Arcade | Plataforma | Rojo (locked automático) |
| Scratch | Plataforma | Verde (locked automático) |
| Acción, Aventura, Puzzle, Plataformas, Carreras, Deportes, Estrategia, Arcade, Disparos, Multijugador | Categoría | Rotación de colores |

- Cada juego tiene **múltiples tags** vía `game_tags`
- La primera tag es **siempre la plataforma** (auto-asignada, no removible)
- Los juegos existentes migraron su `category_id` a tags + platform tag

Ver `lib/actions/games.ts` — `createGame` acepta `tag_ids[]` y auto-inserta platform tag.
Ver `components/TagPicker.tsx` — componente visual de selección múltiple.

## Flujo de publicación

1. Usuario autenticado va a `/subir`
2. **Step 1** — Pantalla de bienvenida: "¿Qué tipo de juego querés publicar?"
   - Dos cards visuales grandes: MakeCode Arcade (rojo, ícono Gamepad2) y Scratch (verde, ícono Puzzle)
   - Sin opciones extras, solo elegir plataforma
3. **Step 2** — Formulario 2 columnas (como la página de juego):
   - **Izquierda** (sticky): Preview embed. Inicialmente placeholder "Pegá la URL del juego", luego embed real + tag cloud
   - **Derecha**: URL input, título, descripción, TagPicker (visual multi-select), ThumbnailPicker
4. El sistema extrae el ID, verifica que no exista duplicado y construye el embed URL
5. Thumbnail: MakeCode → auto (vía API) + upload; Scratch → solo upload
6. Usuario selecciona tags adicionales (plataforma ya está como locked tag en TagPicker)
7. Submit → `createGame` action → inserta con `platform` + `game_tags`, `status: 'approved'`
8. Redirige al perfil del usuario

> [!done] Implementado como parte del plan `docs/raw/plans/2026-07-20-submit-form-tags-redesign.md`.

## Página de detalle (`/juego/[id]`)

La página del juego (`app/(public)/juego/[id]/page.tsx`) tiene dos columnas en desktop:

- **Izquierda** (sticky): componente `GameTabs` que se adapta según la plataforma:
  - **MakeCode**: dos tabs — **Juego** (default, embed `---run?id=`) y **Editor** (embed `#pub:` con sandbox)
  - **Scratch**: un solo tab — **Juego** con el embed de Scratch (`scratch.mit.edu/projects/{id}/embed`)
  - Los tabs aparecen **debajo** del embed. El activo tiene indicador rojo (`bg-arcade-red`).
- **Derecha**: metadata (título, autor, badges, descripción, rating, juegos relacionados)

Ver [[frontend/components#GameTabs]] para detalles del componente.

## Perfil propio (`/perfil/{username}`)

Reemplaza al antiguo dashboard. La ruta `/dashboard` ahora redirige a `/perfil/{username}`.

El perfil propio incluye gestión completa de juegos:

- **Header**: avatar, username, bio, website, stats bar (estrellas totales, cantidad de juegos, seguidores, siguiendo)
- **Tabs**: "Juegos" (grid de `ProfileGameCard`) y "Logros" (grid de badges ganados)
- **ProfileGameCard**: cada juego con thumbnail, badge de estado, métricas (vistas, rating), y acciones:
  - **Editar**: redirige a `/editar/[id]`
  - **Ocultar/Mostrar**: toggle vía `ToggleVisibilityButton`
  - **Eliminar**: confirmación vía `DeleteGameButton`
- **FollowButton**: permite a otros usuarios seguir al dueño del perfil

### Estados visuales (en ProfileGameCard)

| Estado | Badge | Color | Descripción |
|--------|-------|-------|-------------|
| `approved` + `hidden=false` | Publicado | verde (`bg-arcade-green`) | Visible en listados públicos |
| `approved` + `hidden=true` | Oculto | gris (`secondary`) | No visible, pero aprobado |
| `pending` | En moderación | ámbar (`border-amber-400`) | Pendiente de revisión, no visible públicamente |
| `rejected` | Rechazado | rojo (`destructive`) | Rechazado por admin |

## Edición (`/editar/[id]`)

Formulario pre-cargado con los datos actuales del juego:

- Preview del embed (solo lectura)
- ThumbnailPicker para cambiar miniatura
- Campos editables: título, descripción
- TagPicker con tags actuales del juego precargadas (platform tag locked)
- Server action `updateGame` en `lib/actions/games.ts` — reemplaza `game_tags` (delete all + insert)
- Solo el dueño del juego puede editarlo (verificado server-side)
- Redirige a `/perfil/{username}` al guardar exitosamente

## Reglas de negocio

- No puede haber dos juegos con el mismo MakeCode ID
- Solo el dueño puede modificar/ocultar/eliminar su juego
- Juegos ocultos no aparecen en listados públicos
- Juegos `pending` no son visibles al público
- Usuarios anónimos pueden jugar (embed) pero no votar

## Búsqueda

Implementada con ILIKE sobre `title` + filtro por tags:

- `lib/actions/games.ts` — `getGames({ search, tagIds?, page, limit })`
- Filtro por tags: acepta array de tag IDs (incluye platform tags)
- Paginación via LIMIT/OFFSET
- Orden por `created_at DESC` por defecto

## Rating

- 1 voto por usuario por juego (constraint UNIQUE en `ratings(game_id, user_id)`)
- Rango 1-5
- `rateGame(gameId, value)` hace upsert
- El promedio se calcula dinámicamente con AVG

Ver [[database/schema]] para estructura de tablas.
Ver [[architecture/routes]] para rutas.
