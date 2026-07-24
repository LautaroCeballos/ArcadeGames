---
title: "Sistema de Banner del Home"
tags: [feature, admin, frontend]
last_updated: "2026-07-23"
sources:
  - supabase/migrations/00017_banner_slides.sql
  - lib/actions/banner.ts
  - lib/definitions.ts
  - components/HeroSlider.tsx
  - app/(public)/page.tsx
  - app/(protected)/admin/banner/page.tsx
  - app/(protected)/admin/banner/banner-admin-client.tsx
  - components/NavbarClient.tsx
  - docs/raw/plans/2026-07-23-admin-banner-content.md
---

# Sistema de Banner del Home

El sistema permite a los administradores gestionar el contenido del slider principal del home
desde un panel de administración. Cada slide del carrusel puede tener imagen de fondo, título,
subtítulo y botón con texto + link.

## Flujo

1. Un admin accede a `/admin/banner` desde el menú de usuario (ícono de imagen).
2. Ve una lista de slides existentes con preview, orden y acciones.
3. Puede crear, editar, eliminar y reordenar slides.
4. Los cambios se reflejan automáticamente en el HeroSlider del home.
5. Si no hay slides configurados, el slider muestra los defaults hardcodeados.

## Tabla `banner_slides`

La migración `00017_banner_slides.sql` crea la tabla en la DB pública:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid PK` | Identificador único |
| `image_url` | `text?` | URL de la imagen de fondo (desde Storage) |
| `title` | `text` | Título del slide (obligatorio) |
| `description` | `text?` | Subtítulo o descripción |
| `cta_text` | `text` | Texto del botón (obligatorio) |
| `cta_link` | `text` | Link del botón (obligatorio, default `/`) |
| `sort_order` | `int` | Orden de aparición (default 0) |
| `active` | `bool` | Si está visible en el home (default true) |
| `created_at` | `timestamptz` | Fecha de creación |
| `updated_at` | `timestamptz` | Fecha de última modificación |

### Políticas RLS

- `SELECT`: pública (cualquiera puede leer)
- `INSERT`: solo admin
- `UPDATE`: solo admin
- `DELETE`: solo admin

### Storage

Bucket `banners` en Supabase Storage:
- Público (lectura sin autenticación)
- Tipos: `image/png`, `image/jpeg`, `image/webp`
- Límite: 2 MB por archivo
- Operaciones de escritura solo para admins

## Server Actions

Archivo `lib/actions/banner.ts`. Todas las operaciones de escritura verifican rol admin.

| Action | Input | Propósito |
|--------|-------|-----------|
| `getBannerSlides()` | — | Obtiene todos los slides (admin) |
| `getActiveBannerSlides()` | — | Obtiene slides activos para la home pública |
| `createBannerSlide(formData)` | `FormData` con title, description, ctaText, ctaLink, imageUrl | Crea un nuevo slide |
| `updateBannerSlide(id, formData)` | `string` + `FormData` | Actualiza un slide existente |
| `deleteBannerSlide(id)` | `string` | Elimina un slide |
| `reorderBannerSlides(orderedIds)` | `string[]` | Reordena slides según array de IDs |
| `uploadBannerImage(formData)` | `FormData` con file | Sube imagen al bucket `banners` |

## Componentes

### `BannerAdminClient` (`app/(protected)/admin/banner/banner-admin-client.tsx`)
- Client Component con listado de slides + modal de creación/edición
- Preview de imagen, ordenamiento con botones arriba/abajo
- Upload de imagen vía `uploadBannerImage`
- Estados: loading, empty (sin slides), error, submitting

### `HeroSlider` (`components/HeroSlider.tsx`)
- Client Component con carrusel de slides
- Acepta `slides?: Slide[]` (opcional, usa defaults si no se provee)
- Auto-play 5s, pausa en hover, dots de navegación
- Fallback a 3 slides default hardcodeados si no hay datos de DB

### `HeroSliderWrapper` (en `app/(public)/page.tsx`)
- Server Component que fetchea `getActiveBannerSlides()` y mapea al formato `Slide`
- Si hay slides en DB los usa; si no, pasa `undefined` para que HeroSlider use defaults
- Envuelto en `<Suspense>` con skeleton

## Rutas

- `/admin/banner` — Server Component que verifica rol admin (redirige si no)
- Link en NavbarClient: desktop (dropdown admin) y mobile (menú hamburguesa)

## Diseño Visual

El panel admin sigue el mismo estilo que `admin-users-client.tsx`:
- Cabecera con título + botón "Nuevo Slide"
- Cards de slides con preview de imagen, info, botones de acción
- Modal de creación/edición con campos en formulario
- Drag-free reordering con botones arriba/abajo

## Fallback

Si la tabla `banner_slides` está vacía, el HeroSlider muestra sus 3 slides default:
1. "Bienvenido a ArcadePlay" / "Descubrí juegos creados con MakeCode Arcade"
2. "Creá tu propio juego" / "Aprendé a programar con MakeCode Arcade"
3. "Compartí tus creaciones" / "Publicá tus juegos y recibí feedback"
