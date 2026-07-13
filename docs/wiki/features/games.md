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

## Formatos de URL aceptados

| Formato | Ejemplo | ID extraído |
|---------|---------|-------------|
| `arcade.makecode.com/---run?id=...` | `https://arcade.makecode.com/---run?id=_HdY0sobLD4zd` | `_HdY0sobLD4zd` |
| `makecode.com/_...` | `https://makecode.com/_ViYEarFuVgC8` | `_ViYEarFuVgC8` |
| `arcade.makecode.com/...` (path) | `https://arcade.makecode.com/66795-36651-40272-92516` | `66795-36651-40272-92516` |

## Identificador

El Game ID se extrae con `extractGameId()` en `lib/game-utils.ts`. Soporta los 3 formatos:

1. Parámetro `?id=` en query string
2. Path en `makecode.com/ID`
3. Path en `arcade.makecode.com/ID` (excepto rutas `---`)

La URL de embed siempre se construye como:

```
https://arcade.makecode.com/---run?id={ID}
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
