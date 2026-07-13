---
title: "ArcadePlay — Esquema de Base de Datos"
tags: [database, schema]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
---

# ArcadePlay — Esquema de Base de Datos

## Tablas

### `profiles`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Referencia `auth.users` ON DELETE CASCADE |
| username | text UNIQUE | |
| avatar_url | text | |
| created_at | timestamp | Default `now()` |

### `categories`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| name | text UNIQUE NOT NULL | |

### `games`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | text PK | MakeCode ID (extraído de la URL) |
| user_id | uuid FK → profiles(id) | |
| title | text NOT NULL | |
| description | text | |
| embed_url | text NOT NULL | Construido con `buildEmbedUrl(id)` |
| thumbnail_url | text | |
| category_id | uuid FK → categories(id) | |
| status | text | Default `'pending'`. Valores: `pending`, `approved`, `rejected` |
| hidden | boolean | Default `false` |
| created_at | timestamp | Default `now()` |
| views | integer | Default `0` |

### `tags`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| name | text UNIQUE | |

### `game_tags`
| Columna | Tipo | Notas |
|---------|------|-------|
| game_id | text FK → games(id) ON DELETE CASCADE | |
| tag_id | uuid FK → tags(id) ON DELETE CASCADE | |
| PK | (game_id, tag_id) | |

### `ratings`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| game_id | text FK → games(id) ON DELETE CASCADE | |
| user_id | uuid FK → profiles(id) | |
| value | integer | CHECK (1-5) |
| UNIQUE | (game_id, user_id) | Un voto por usuario por juego |

## Políticas RLS (Row Level Security)

### `games`
- **SELECT**: `status = 'approved' AND hidden = false` (público) O `user_id = auth.uid()` (propio)
- **INSERT**: `auth.uid() = user_id` (solo autenticados creando propios)
- **UPDATE**: `auth.uid() = user_id` (solo el dueño)
- **DELETE**: `auth.uid() = user_id` (solo el dueño)

### `ratings`
- **SELECT**: cualquiera (público)
- **INSERT**: `auth.uid() = user_id` (autenticado, propio)
- **UPDATE**: `auth.uid() = user_id` (propio)

### `profiles`
- **SELECT**: cualquiera (username, avatar_url son públicos)
- **INSERT**: `auth.uid() = id` (solo propio perfil al registrarse)
- **UPDATE**: `auth.uid() = id` (solo propio)

## Índices planeados

- `games (status, hidden)` — filtro de juegos públicos
- `games (user_id)` — perfil del usuario
- `ratings (game_id)` — cálculo de promedio

> [!todo] Verificar
> Agregar índice `pg_trgm` en `games.title` para búsqueda ILIKE eficiente cuando se implemente.
