---
title: "Sistema de Banner del Home"
tags: [feature, admin, frontend]
last_updated: "2026-07-27"
sources:
  - supabase/migrations/00017_banner_slides.sql
  - supabase/migrations/00021_banner_slide_templates.sql
  - supabase/migrations/00025_banner_clickable_options.sql
  - supabase/migrations/00026_banner_slide_duration.sql
  - lib/actions/banner.ts
  - lib/definitions.ts
  - components/HeroSlider.tsx
  - hooks/use-dominant-colors.ts
  - app/(public)/page.tsx
  - app/(protected)/admin/banner/page.tsx
  - app/(protected)/admin/banner/banner-admin-client.tsx
  - components/NavbarClient.tsx
  - docs/raw/plans/2026-07-24-banner-templates.md
  - docs/raw/plans/2026-07-27-hero-slider-mobile-height-fix.md
  - docs/raw/plans/2026-07-27-bar-mobile-full-image-click.md
  - docs/raw/plans/2026-07-27-banner-dialog-mobile-column-2.md
---

# Sistema de Banner del Home

El sistema permite a los administradores gestionar el contenido del slider principal del home
desde un panel de administración. Cada slide usa una **plantilla** que define su layout visual.

## Flujo

1. Un admin accede a `/admin/banner` desde el menú de usuario (ícono de imagen).
2. Ve una lista de slides existentes con preview, orden y acciones.
3. Puede crear, editar, eliminar y reordenar slides.
4. Los cambios se reflejan automáticamente en el HeroSlider del home.
5. Si no hay slides configurados, el slider muestra los defaults hardcodeados.

## Plantillas

| Template | Vista previa | Comportamiento |
|----------|-------------|----------------|
| **`bar-right`** | Split 25/75: texto a la izquierda (25%), imagen a la derecha (75%) | Título, subtítulo y botón en columna vertical centrada. Desktop: lado a lado. Mobile: contenido arriba (auto), imagen abajo (aspect-video). |
| **`bar-left`** | Split 25/75: imagen a la izquierda (75%), texto a la derecha (25%) | Igual que bar-right pero imagen a la izquierda y texto a la derecha. |
| **`full-image`** | Imagen 100%, sin texto visible | Todo el slide es un link. Gradiente sutil abajo para los dots del carrusel. |

### Características visuales del split (`components/HeroSlider.tsx:159`)
- **Desktop**: `flex-row` con `md:aspect-[3/1]` en el contenedor padre. Columna de texto 25% (`md:w-[25%]`), imagen 75% (`md:w-[75%]`). Ambas columnas tienen la misma altura determinada por el aspect ratio. El botón CTA en el panel de texto respeta `open_in_new_tab` de la DB.
- **Mobile**: `flex-col` con altura fija `h-[420px]`. El panel de texto está oculto (`hidden md:flex`). La imagen ocupa el 100% de la altura (`flex-1`) con un `<Link>` overlay invisible (`absolute inset-0 z-10 md:hidden`) que cubre toda el área y navega al CTA link. El link usa `open_in_new_tab` para decidir si abre en nueva pestaña.
- **Colores dominantes**: el fondo del texto extrae 2 colores de la imagen vía k-means (`hooks/use-dominant-colors.ts`). Se oscurecen forzosamente (luminosidad ≤ 35%) para garantizar legibilidad del texto blanco. Fallback: `bg-gradient-to-br from-arcade-dark to-arcade-red/80`.
- **Contenido** (solo visible en desktop): título `text-xl md:text-3xl`, descripción `text-sm md:text-base` con `line-clamp-3`, botón `bg-primary rounded-[10px]` con `shrink-0`.
- **Imagen**: `object-cover` dentro de un contenedor `absolute inset-0`.

## Tabla `banner_slides`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid PK` | Identificador único |
| `image_url` | `text?` | URL de la imagen de fondo (desde Storage) |
| `title` | `text` | Título del slide (obligatorio) |
| `description` | `text?` | Subtítulo o descripción |
| `cta_text` | `text` | Texto del botón (obligatorio) |
| `cta_link` | `text` | Link del botón (obligatorio, default `/`) |
| `sort_order` | `int` | Orden de aparición (default 0) |
| `template` | `text` | Plantilla: `bar-right`, `bar-left` o `full-image` (default `bar-right`). Migración `00021` |
| `clickable` | `bool` | Si la imagen del slide actúa como enlace (`full-image`). Migración `00025` |
| `open_in_new_tab` | `bool` | Si el CTA abre en nueva pestaña (todos los templates). Migración `00025` |
| `duration` | `int` | Duración del slide en segundos (2-30, default 5). Migración `00026` |
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
| `createBannerSlide(formData)` | `FormData` con title, description, ctaText, ctaLink, imageUrl, template | Crea un nuevo slide |
| `updateBannerSlide(id, formData)` | `string` + `FormData` | Actualiza un slide existente |
| `deleteBannerSlide(id)` | `string` | Elimina un slide |
| `reorderBannerSlides(orderedIds)` | `string[]` | Reordena slides según array de IDs |
| `uploadBannerImage(formData)` | `FormData` con file | Sube imagen al bucket `banners` |

## Componentes

### `BannerAdminClient` (`app/(protected)/admin/banner/banner-admin-client.tsx`)
- Client Component con listado de slides + modal de creación/edición
- **Diálogo de dos columnas**: formulario a la izquierda, configuración (plantilla, enlace, duración) a la derecha
- **Selector de plantilla**: 3 cards visuales con miniaturas de cada layout (barra derecha, barra izquierda, imagen completa) con estilo unificado tipo form (`border bg-background`)
- **Enlace**: checkboxes con estilo card (`border bg-background px-3 py-2.5`). Para `full-image`: "La imagen es un enlace cliqueable" + "Abrir en una nueva pestaña" (condicional). Para `bar-right`/`bar-left`: "Abrir CTA en nueva pestaña"
- **Duración**: input number (2-30s, default 5), vinculado al form con `form="slide-form"`
- Upload de imagen vía `uploadBannerImage`
- Ordenamiento con botones arriba/abajo
- **Mobile**: diálogo scrolleable (`max-h-[90vh] overflow-y-auto`), columna 2 visible debajo de columna 1 sin barra separadora. Botones de acción (Editar/Eliminar) ocultos y reemplazados por menú kebab (⋮) con dropdown. Body scroll bloqueado al abrir diálogo (`overflow: hidden`). Botón X en esquina superior derecha para cerrar
- **Desktop**: layout side-by-side intacto, columna 1 con scroll propio, iconos de acción individuales (lápiz/papelera)
- Estados: loading, empty (sin slides), error, submitting
- Título con icono: `Pencil` para editar, `ImagePlus` para nuevo

### `HeroSlider` (`components/HeroSlider.tsx`)
- Client Component con carrusel de slides
- Acepta `slides?: Slide[]` (opcional, usa defaults si no se provee)
- Estado: `current` (índice activo), `isPaused` (hover)
- Auto-play cada 5s via `setInterval` (`components/HeroSlider.tsx:60-64`). Pausa en hover (`onMouseEnter`/`onMouseLeave`).
- **Transición suave**: todos los slides se renderizan siempre apilados con CSS Grid (`grid grid-cols-1 grid-rows-1`). Cada slide ocupa la misma celda (`col-span-full row-span-full`). El slide activo tiene `opacity-100`, los inactivos `opacity-0 pointer-events-none`. La transición se hace con `transition-opacity duration-500 ease-in-out`.
- Dots de navegación (`absolute bottom-4`) con `role="tablist"` y `aria-selected`.
- Fallback a 3 slides default hardcodeados (`template: "bar-right"`).
- **Ken Burns unificado**: todos los slides usan el mismo sistema de animación con tick + keyframes duales (`ken-burns-0` / `ken-burns-1`). El contador `tick` incrementa al activarse, alternando el nombre de la animación vía inline style para forzar restart sin remover el estilo. Al desactivarse, queda congelado en `forwards` sin snap. Key estable del `<img>` (`fi-{id}` / `bs-{id}`) para evitar remount de React.
- `Slide` interface: incluye `clickable`, `openInNewTab`, `duration` y `hideContent` (solo `bar-left`/`bar-right` con contenido ocultable).
  - **`bar-right`/`bar-left`**: split 25/75 — columna de contenido + columna de imagen con colores dominantes. Desktop lado a lado con alturas iguales. Mobile apilados: panel de texto oculto (`hidden md:flex`), imagen full-width. Con `hideContent=true`: imagen a 100% de ancho centrada con `object-contain` sobre fondo degradado.
  - **`full-image`**: soporta `clickable` (toggle de link) y `openInNewTab`. Imagen con Ken Burns animado al activarse.

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
- Cards de slides con preview de imagen, info, botones de acción + badge de plantilla
- Modal de creación/edición con diseño de dos columnas: formulario a la izquierda, configuración (plantilla, enlace, duración) a la derecha
- En mobile el diálogo es scrolleable con ambas columnas apiladas verticalmente
- **Selector de plantilla**: 3 cards con miniatura visual del layout, nombre y descripción corta. Estilo unificado con inputs del form (`border bg-background`, seleccionado `border-arcade-red bg-arcade-red/5 shadow-sm`)
- **Opciones de enlace**: checkboxes con estilo card, sección con label "Enlace"
- **Duración**: input de 2-30s debajo de Enlaces
- **Botones**: Cancelar/Guardar al final de la columna derecha, submit vinculado con `form="slide-form"`
- **Acciones en lista**: iconos individuales en desktop, menú kebab (⋮) en mobile
- Botón X en esquina superior derecha del diálogo para cerrar
- Body scroll bloqueado al abrir el diálogo

## Altura del slider

La altura varía según plantilla y viewport:

- **BarSlide (desktop)**: `md:aspect-[3/1]` en el contenedor padre. La altura es relativa al ancho (3:1). Ejemplo: a 1280px → ~411px.
- **BarSlide (mobile)**: Altura fija de `420px` (`h-[420px]`) para garantizar consistencia entre todos los slides. **El panel de texto se oculta completamente** (`hidden md:flex`) y la imagen ocupa el 100% de la altura (`flex-1`) actuando como un enlace cliqueable al link del CTA. En desktop el panel de texto reaparece con el layout split 25/75.
- **FullImageSlide**: `h-[420px] w-full` en mobile, `md:h-auto md:aspect-[3/1]` en desktop. El mismo crop que BarSlide en mobile.

## Fallback

Si la tabla `banner_slides` está vacía, el HeroSlider muestra sus 3 slides default:
1. "Bienvenido a ArcadePlay" / "Descubrí juegos creados con MakeCode Arcade"
2. "Creá tu propio juego" / "Aprendé a programar con MakeCode Arcade"
3. "Compartí tus creaciones" / "Publicá tus juegos y recibí feedback"
