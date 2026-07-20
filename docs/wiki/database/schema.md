---
title: "ArcadePlay — Esquema de Base de Datos"
tags: [database, schema]
last_updated: "2026-07-20"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - docs/raw/plans/2026-07-20-submit-form-dual-platform.md
---

# ArcadePlay — Esquema de Base de Datos

## Tablas

### `profiles`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Referencia `auth.users` ON DELETE CASCADE |
| username | text UNIQUE | |
| avatar_url | text | |
| bio | text | Opcional, visible en perfil |
| website | text | Opcional, enlace externo |
| created_at | timestamp | Default `now()` |

### `categories`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| name | text UNIQUE NOT NULL | |

### `games`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | text PK | MakeCode ID o `scratch_{id}` para Scratch |
| user_id | uuid FK → profiles(id) | |
| platform | text NOT NULL | Default `'makecode'`. Valores: `makecode`, `scratch`. CHECK constraint |
| title | text NOT NULL | |
| description | text | |
| embed_url | text NOT NULL | Construido según plataforma (`buildEmbedUrl` o `buildScratchEmbedUrl`) |
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

### `badges`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| name | text UNIQUE NOT NULL | |
| description | text NOT NULL | |
| icon_url | text | Ícono del emblema |
| criteria | text NOT NULL | Cómo se obtiene |
| created_at | timestamp | Default `now()` |

### `user_badges`
| Columna | Tipo | Notas |
|---------|------|-------|
| user_id | uuid FK → profiles(id) | ON DELETE CASCADE |
| badge_id | uuid FK → badges(id) | |
| earned_at | timestamp | Default `now()` |
| PK | (user_id, badge_id) | |

### `follows`
| Columna | Tipo | Notas |
|---------|------|-------|
| follower_id | uuid FK → profiles(id) | ON DELETE CASCADE |
| following_id | uuid FK → profiles(id) | ON DELETE CASCADE |
| created_at | timestamp | Default `now()` |
| PK | (follower_id, following_id) | |
| CHECK | follower_id ≠ following_id | |

## Storage

### `game-thumbnails` bucket
- **Tipo**: Público (lectura pública)
- **Upload**: Solo autenticados, ruta `{user_id}/{uuid}.{ext}`
- **Límite**: 2 MB por archivo
- **Formatos**: PNG, JPG, WebP

### Políticas de storage
| Operación | ¿Quién? | Condición |
|-----------|---------|-----------|
| SELECT | `public` | bucket_id = 'game-thumbnails' |
| INSERT | `authenticated` | carpeta raíz = `auth.uid()` |
| UPDATE | `authenticated` | carpeta raíz = `auth.uid()` |
| DELETE | `authenticated` | carpeta raíz = `auth.uid()` |

### `badges`
- **SELECT**: público
- **INSERT/UPDATE/DELETE**: solo admin (no implementado aún)

### `user_badges`
- **SELECT**: público
- **INSERT**: propio badge (`auth.uid() = user_id`) — otorgado vía función `award_badge()`

### `follows`
- **SELECT**: público
- **INSERT**: `auth.uid() = follower_id`
- **DELETE**: `auth.uid() = follower_id`

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

## Índices

- `games (status, hidden)` — filtro de juegos públicos
- `games (user_id)` — perfil del usuario
- `ratings (game_id)` — cálculo de promedio
- `games (platform)` — filtro por plataforma

> [!todo] Verificar
> Agregar índice `pg_trgm` en `games.title` para búsqueda ILIKE eficiente cuando se implemente.
