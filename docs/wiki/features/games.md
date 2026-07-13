---
title: "ArcadePlay — Sistema de Juegos"
tags: [feature, games]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
---

# ArcadePlay — Sistema de Juegos

## Concepto

Los juegos no se suben al servidor. Se referencian mediante su URL de MakeCode Arcade.

Ejemplo de URL:
```
https://arcade.makecode.com/---run?id=_HdY0sobLD4zd
```

## Identificador

El Game ID es el parámetro `id` de la URL de MakeCode. Se extrae con `extractGameId()`:

```
// lib/game-utils.ts
export function extractGameId(url: string): string | null {
  const match = url.match(/id=([a-zA-Z0-9\-_]+)/)
  return match ? match[1] : null
}
```

La URL de embed se construye con `buildEmbedUrl()`:

```
// lib/game-utils.ts
export function buildEmbedUrl(id: string) {
  return `https://arcade.makecode.com/---run?id=${id}`
}
```

## Flujo de publicación

1. Usuario autenticado va a `/subir`
2. Pega la URL de MakeCode
3. El sistema extrae el ID y verifica que no exista duplicado
4. Usuario completa título, descripción, categoría y tags
5. Se muestra preview del embed
6. Submit → `createGame` action → inserta con `status: 'pending'`
7. Admin aprueba/rechaza (futuro) / por ahora se puede aprobar automáticamente

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
