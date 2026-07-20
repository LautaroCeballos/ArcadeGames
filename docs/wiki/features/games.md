---
title: "ArcadePlay — Sistema de Juegos"
tags: [feature, games]
last_updated: "2026-07-20"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - docs/raw/plans/2026-07-20-submit-form-dual-platform.md
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

## Flujo de publicación

1. Usuario autenticado va a `/subir`
2. **Selecciona plataforma**: MakeCode Arcade o Scratch (toggle visual)
3. Pega la URL correspondiente a la plataforma seleccionada
4. El sistema extrae el ID, verifica que no exista duplicado y construye el embed URL
5. Se muestra preview del embed (usando `ArcadeEmbed` o `ScratchEmbed` según plataforma)
6. Thumbnail: MakeCode → auto (vía API) + upload; Scratch → solo upload
7. Usuario completa título, descripción, categoría
8. Submit → `createGame` action → inserta con `platform`, `status: 'approved'`
9. Redirige al perfil del usuario

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
- Campos editables: título, descripción, categoría
- Server action `updateGame` en `lib/actions/games.ts:93`
- Solo el dueño del juego puede editarlo (verificado server-side)
- Redirige a `/perfil/{username}` al guardar exitosamente

## Reglas de negocio

- No puede haber dos juegos con el mismo MakeCode ID
- Solo el dueño puede modificar/ocultar/eliminar su juego
- Juegos ocultos no aparecen en listados públicos
- Juegos `pending` no son visibles al público
- Usuarios anónimos pueden jugar (embed) pero no votar

## Búsqueda

Implementada con ILIKE sobre `title` + join con `tags` + filtro por categoría:

- `lib/actions/games.ts` — `getGames({ search, categoryId, tagIds, page, limit })`
- Paginación via LIMIT/OFFSET
- Orden por `created_at DESC` por defecto

## Rating

- 1 voto por usuario por juego (constraint UNIQUE en `ratings(game_id, user_id)`)
- Rango 1-5
- `rateGame(gameId, value)` hace upsert
- El promedio se calcula dinámicamente con AVG

Ver [[database/schema]] para estructura de tablas.
Ver [[architecture/routes]] para rutas.
