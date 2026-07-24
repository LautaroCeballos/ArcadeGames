# Plan: Administración de contenido del banner principal

## 1. Objetivo
Permitir que los administradores del sitio modifiquen el contenido del banner slider del home desde un panel de administración: seleccionar imagen, título, subtítulo y botón (texto + link) para cada slide.

## 2. Contexto actual
- El home (`app/(public)/page.tsx`) renderiza `<HeroSlider />` sin props.
- `HeroSlider` (`components/HeroSlider.tsx`) usa 3 slides mock hardcodeados con `/** Mock slides — replace with CMS or dynamic data later */`.
- Cada `Slide` tiene: `id`, `imageUrl`, `title`, `description`, `ctaText`, `ctaLink`.
- Ya existe un panel admin en `/admin/usuarios` con patrón Server Component que verifica rol + Client Component.
- Ya existe manejo de imágenes vía Supabase Storage (bucket `avatars`, patrón en `lib/actions/thumbnails.ts`).
- No existe tabla de banners ni de contenido CMS en la DB.

## 3. Problema
El contenido del banner principal está hardcodeado. Los admins no pueden modificarlo sin editar código.

## 4. Resultado esperado
- Los admins pueden gestionar los slides del banner desde `/admin/banner`:
  - Ver lista de slides existentes
  - Agregar nuevo slide: imagen, título, subtítulo, texto del botón, link del botón
  - Editar slide existente
  - Eliminar slide
  - Reordenar slides
- El HeroSlider del home muestra los slides gestionados desde el admin.
- Si no hay slides configurados, muestra los defaults actuales como fallback.

## 5. Restricciones y supuestos
- Supabase Postgres como DB, Storage para imágenes.
- Solo admins pueden gestionar banners (rol `admin`).
- Máximo 5 slides activos visibles.
- Imágenes: max 2MB, formatos image/png, image/jpeg, image/webp.
- Se respeta el patrón existente de Server Components + Client Components del admin.
- Las imágenes se almacenan en bucket `banners` de Supabase Storage.

## 6. Dirección visual
- El panel admin sigue el mismo estilo que `admin-users-client.tsx`: layout simple, tabla/sistema de cards.
- Formulario inline o en modal/dialog para editar slides.
- Preview visual del slide en el admin.
- El HeroSlider mantiene su diseño actual (gradientes + overlay de texto).

## 7. Skills y referencias a usar
- `next-best-practices` — Server/Client components, Server Actions
- `tailwind-css-patterns` — Estilos consistentes
- `supabase` — Migración, Storage, RLS
- `frontend-design` — UI del admin y HeroSlider

## 8. Arquitectura de implementación

### Nueva tabla: `banner_slides`
```sql
create table banner_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  title text not null,
  description text,
  cta_text text not null,
  cta_link text not null default '/',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Políticas RLS:
- Lectura pública (cualquiera puede ver los slides activos)
- Solo admins pueden INSERT/UPDATE/DELETE

### Flujo de datos:
1. Admin page (`/admin/banner`) → Server Component verifica rol → Client Component con CRUD
2. Server actions (`lib/actions/banner.ts`) → Supabase queries
3. HeroSlider en home → Server Component wrapper fetch desde DB → pasa slides al Client Component
4. Si no hay slides en DB → usar defaults hardcodeados

## 9. Cambios por archivo

### Crear:
1. **`supabase/migrations/00017_banner_slides.sql`** — Tabla + RLS + Storage bucket `banners`
2. **`lib/actions/banner.ts`** — Server actions: `getBannerSlides`, `createBannerSlide`, `updateBannerSlide`, `deleteBannerSlide`, `reorderBannerSlides`, `uploadBannerImage`
3. **`app/(protected)/admin/banner/page.tsx`** — Server Component: verifica rol admin, renderiza client
4. **`app/(protected)/admin/banner/banner-admin-client.tsx`** — Client Component: CRUD de slides

### Modificar:
5. **`lib/definitions.ts`** — Agregar tipo `BannerSlide`
6. **`components/HeroSlider.tsx`** — Aceptar slides desde props (ya lo hace), mantener defaults
7. **`app/(public)/page.tsx`** — Fetch slides desde DB y pasarlos a HeroSlider
8. **`components/NavbarClient.tsx`** — Agregar link a `/admin/banner` en menú admin

## 10. Componentes y contratos

### `BannerSlide` (type en definitions.ts)
```typescript
export interface BannerSlide {
  id: string
  image_url: string | null
  title: string
  description: string | null
  cta_text: string
  cta_link: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}
```

### Server actions (`lib/actions/banner.ts`)
| Action | Input | Output |
|--------|-------|--------|
| `getBannerSlides()` | — | `BannerSlide[]` |
| `createBannerSlide(data)` | `Pick<BannerSlide, "title" \| "description" \| "cta_text" \| "cta_link">` + `image?: File` | `{ success: true }` \| `{ error: string }` |
| `updateBannerSlide(id, data)` | `Partial<BannerSlide>` + `image?: File` | `{ success: true }` \| `{ error: string }` |
| `deleteBannerSlide(id)` | `string` | `{ success: true }` \| `{ error: string }` |
| `reorderBannerSlides(ids)` | `string[]` (ordered IDs) | `{ success: true }` \| `{ error: string }` |
| `uploadBannerImage(formData)` | `FormData` with file | `{ url: string }` \| `{ error: string }` |

## 11. Estados y comportamiento

### Admin panel:
- **Loading**: Skeleton animado mientras carga slides
- **Empty**: Mensaje "No hay slides. Creá el primero." + botón crear
- **Error**: Alert Triangle con mensaje de error
- **Success**: Toast de confirmación al crear/editar/eliminar
- **Submitting**: Botón deshabilitado + spinner durante upload

### HeroSlider:
- **Loading**: Server Component resuelve antes de renderizar (espera a DB)
- **Empty/No slides**: Muestra defaults hardcodeados actuales
- **Normal**: Slides desde DB con auto-play

## 12. Responsive
- Admin panel: desktop-first con tabla; mobile: cards verticales
- HeroSlider ya es responsive (aspect-ratio, text responsive)

## 13. Accesibilidad
- HeroSlider ya tiene `role="region"`, `aria-roledescription="carousel"`, `role="tablist"`, `aria-selected`
- Admin forms: labels, focus management, error messages
- Imágenes: alt text configurable desde admin

## 14. Riesgos y mitigaciones
| Riesgo | Mitigación |
|--------|------------|
| Imagen muy grande | Validar tamaño (2MB) y tipo en server + client |
| Admins suben muchas slides | Limitar a 10 slides |
| RLS bloquea lectura pública | Política de SELECT sin auth para slides activas |
| Archivos huérfanos en Storage | Al eliminar slide, no borramos imagen (se puede optimizar después) |

## 15. Orden de ejecución
1. Migración SQL (tabla + storage + RLS)
2. Tipo `BannerSlide` en definitions.ts
3. Server actions en `lib/actions/banner.ts`
4. Admin page (server + client)
5. Actualizar HeroSlider y home page
6. Agregar link en NavbarClient
7. Validar con chrome-devtools

## 16. Validación en navegador
- [ ] Admin puede acceder a `/admin/banner`
- [ ] Admin ve lista de slides (vacía al inicio)
- [ ] Admin puede crear slide con imagen + título + subtítulo + botón
- [ ] Admin puede editar slide existente
- [ ] Admin puede eliminar slide
- [ ] Admin puede reordenar slides
- [ ] HeroSlider en home muestra los slides de la DB
- [ ] Si no hay slides, muestra defaults
- [ ] Imágenes se renderizan correctamente
- [ ] Responsive: admin ok en 375px+
- [ ] Auto-play del slider funciona

## 17. Criterios de aceptación
- [ ] Los admins pueden crear, editar y eliminar slides del banner
- [ ] Cada slide tiene: imagen de fondo, título, subtítulo, texto de botón, link
- [ ] Las imágenes se almacenan en Supabase Storage
- [ ] El home muestra los slides configurados por el admin
- [ ] El panel admin es accesible solo para rol admin
- [ ] El HeroSlider tiene fallback a defaults si no hay slides
