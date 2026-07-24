---
title: "ArcadePlay — Esquema de Base de Datos"
tags: [database, schema]
last_updated: "2026-07-23"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - docs/raw/plans/2026-07-20-submit-form-dual-platform.md
  - docs/raw/plans/2026-07-20-submit-form-tags-redesign.md
  - supabase/migrations/00014_notifications.sql
  - supabase/migrations/00008_profiles_email_display_name.sql
  - supabase/migrations/00009_avatars_storage.sql
  - supabase/migrations/00010_moderator_role.sql
  - supabase/migrations/00011_rejection_reason.sql
  - supabase/migrations/00012_admin_update_profiles.sql
  - supabase/migrations/00013_draft_status.sql
  - supabase/migrations/00017_banner_slides.sql
---

# ArcadePlay — Esquema de Base de Datos

## Tablas

### `profiles`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Referencia `auth.users` ON DELETE CASCADE |
| username | text UNIQUE | |
| email | text | Email del usuario (almacenado por trigger `handle_new_user`) |
| avatar_url | text | |
| bio | text | Opcional, visible en perfil |
| website | text | Opcional, enlace externo |
| birth_month | integer | CHECK 1-12. Opcional |
| birth_year | integer | CHECK 1900-{current}. Opcional |
| country | text | Código ISO 3166-1 alfa-2. Opcional |
| role | text | Default `'user'`. CHECK: `user`, `moderator`, `admin`. Migración `00010` |
| created_at | timestamp | Default `now()` |

> [!note] La columna `email` fue agregada en la migración `00008` junto con la actualización del trigger `handle_new_user` para almacenar `raw_user_meta_data->>'username'` y `new.email`.
> [!note] La columna `role` fue agregada en la migración `00010`. Los moderadores (`moderator`) pueden aprobar/rechazar/editar/eliminar cualquier juego. Los admins (`admin`) además pueden gestionar roles de usuarios.

### `categories` (deprecada → reemplazada por tags)
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| name | text UNIQUE NOT NULL | |

> [!note] A partir de la migración `00005_tags_migration.sql`, `categories` ya no se usa. Las categorías se migraron a la tabla `tags`. La columna `games.category_id` fue eliminada.

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
| status | text | Default `'pending'`. Valores: `draft`, `pending`, `approved`, `rejected`. Migración `00013` agrega `draft` |
| hidden | boolean | Default `false` |
| created_at | timestamp | Default `now()` |
| views | integer | Default `0` |
| rejection_reason | text | Motivo del rechazo (nullable). Migración `00011` |

### `tags`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| name | text UNIQUE | Seeded con 12 tags: MakeCode Arcade, Scratch + 10 categorías |

> [!note] Las tags reemplazan a `categories` como sistema de clasificación. Cada juego puede tener múltiples tags. La primera tag es siempre la plataforma (auto-asignada).

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

### `notifications`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| user_id | uuid FK → profiles(id) | ON DELETE CASCADE |
| type | text | CHECK: `game_approved`, `game_rejected`, `new_game_from_following`, `new_rating`, `new_follower` |
| title | text NOT NULL | Título corto de la notificación |
| message | text NOT NULL | Mensaje descriptivo |
| link_url | text NOT NULL | URL al recurso relacionado |
| actor_id | uuid FK → profiles(id) | Usuario que originó el evento (nullable, ON DELETE SET NULL) |
| read | boolean | Default `false` |
| created_at | timestamptz | Default `now()` |

**Índices**: `idx_notifications_user` (user_id, created_at DESC), `idx_notifications_unread` (user_id WHERE NOT read)

**RLS**: SELECT y UPDATE solo para `auth.uid() = user_id`. INSERT via función `create_notification()` con `SECURITY DEFINER`.

### `follows`
| Columna | Tipo | Notas |
|---------|------|-------|
| follower_id | uuid FK → profiles(id) | ON DELETE CASCADE |
| following_id | uuid FK → profiles(id) | ON DELETE CASCADE |
| created_at | timestamp | Default `now()` |
| PK | (follower_id, following_id) | |
| CHECK | follower_id ≠ following_id | |

### `banner_slides`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| image_url | text | URL de la imagen de fondo desde Storage |
| title | text NOT NULL | Título del slide |
| description | text | Subtítulo |
| cta_text | text NOT NULL | Texto del botón |
| cta_link | text NOT NULL | Link del botón, default `/` |
| sort_order | integer | Orden de aparición, default 0 |
| active | boolean | Visible en home, default true |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

**RLS**: SELECT pública, INSERT/UPDATE/DELETE solo admin (vía `profiles.role = 'admin'`).
**Migración**: `00017_banner_slides.sql`.

## Storage

### `game-thumbnails` bucket
- **Tipo**: Público (lectura pública)
- **Upload**: Solo autenticados, ruta `{user_id}/{uuid}.{ext}`
- **Límite**: 2 MB por archivo
- **Formatos**: PNG, JPG, WebP

### `banners` bucket
- **Tipo**: Público (lectura pública)
- **Upload**: Solo admins (`profiles.role = 'admin'`)
- **Límite**: 2 MB por archivo
- **Formatos**: PNG, JPG, WebP
- **Creado en**: migración `00017_banner_slides.sql`

### `avatars` bucket
- **Tipo**: Público (lectura pública)
- **Upload**: Solo autenticados, ruta `{user_id}/{uuid}.{ext}`
- **Límite**: 2 MB por archivo
- **Formatos**: PNG, JPG, WebP, GIF
- **Creado en**: migración `00009_avatars_storage.sql`

### Políticas de storage
| Operación | ¿Quién? | Condición |
|-----------|---------|-----------|
| SELECT | `public` | bucket_id = 'game-thumbnails' O bucket_id = 'avatars' |
| INSERT | `authenticated` | bucket_id = 'game-thumbnails' (carpeta raíz = `auth.uid()`) O bucket_id = 'avatars' |
| UPDATE | `authenticated` | bucket_id = 'game-thumbnails' (carpeta raíz = `auth.uid()`) O bucket_id = 'avatars' (owner = `auth.uid()`) |
| DELETE | `authenticated` | bucket_id = 'game-thumbnails' (carpeta raíz = `auth.uid()`) O bucket_id = 'avatars' (owner = `auth.uid()`) |

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
- **SELECT**: `(status = 'approved' AND hidden = false)` (público) O `user_id = auth.uid()` (propio) O `role IN ('moderator', 'admin')` (moderadores)
- **INSERT**: `auth.uid() = user_id` (solo autenticados creando propios)
- **UPDATE**: `auth.uid() = user_id` (dueño) O `role IN ('moderator', 'admin')` (moderadores)
- **DELETE**: `auth.uid() = user_id` (dueño) O `role IN ('moderator', 'admin')` (moderadores)

### `ratings`
- **SELECT**: cualquiera (público)
- **INSERT**: `auth.uid() = user_id` (autenticado, propio)
- **UPDATE**: `auth.uid() = user_id` (propio)

### `profiles`
- **SELECT**: cualquiera (username, avatar_url, birth_month, birth_year, country son públicos)
- **INSERT**: `auth.uid() = id` (solo propio perfil al registrarse)
- **UPDATE**: `auth.uid() = id` (solo propio)

## Índices

- `games (status, hidden)` — filtro de juegos públicos
- `games (user_id)` — perfil del usuario
- `ratings (game_id)` — cálculo de promedio
- `games (platform)` — filtro por plataforma

> [!todo] Verificar
> Agregar índice `pg_trgm` en `games.title` para búsqueda ILIKE eficiente cuando se implemente.
