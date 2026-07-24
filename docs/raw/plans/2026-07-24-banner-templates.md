# Plan: Sistema de Plantillas para Sliders del Banner

## Motivación
El panel de edición actual tiene demasiadas opciones (colores, alineaciones, modos de botón, toggle del panel) que saturan la interfaz y no mejoran el resultado visual. Se reemplaza por un sistema de 3 plantillas predefinidas donde el admin solo elige layout y completa contenido.

## Plantillas

### `bar-right`
- Imagen 100% de fondo (`object-cover`)
- Barra vidriosa `w-1/6` superpuesta a la derecha (desktop)
- `backdrop-blur-sm` + `bg-black/60`
- Texto (título + descripción) + botón CTA dentro de la barra
- Mobile: barra pasa a full-width abajo en `flex-row`

### `bar-left`
- Igual que bar-right pero barra a la izquierda

### `full-image`
- Imagen 100% de fondo, sin texto visible
- Todo el slide es un `<Link>` → redirige a `cta_link`
- Gradiente sutil en la parte inferior para que los dots del carrusel se vean

## DB
- `alter table banner_slides add column template text not null default 'bar-right' check (template in ('bar-right','bar-left','full-image'))`
- Las columnas viejas (overlay_color, text_color, button_color, show_panel, panel_align, panel_valign, button_mode) se mantienen en la tabla pero HeroSlider deja de leerlas

## Admin panel (rediseñado)
- Se eliminan: color pickers, toggle panel, alineaciones, modo botón, sección "Opciones del panel"
- Queda: imagen, título, subtítulo, texto botón + link, selector de plantilla (3 cards visuales), preview

## HeroSlider (reescritura)
- `Slide` interface simplificada: solo template en lugar de overlayColor/textColor/buttonColor/showPanel/panelAlign/panelValign/buttonMode
- Render condicional según `slide.template`
- `bar-right`/`bar-left`: imagen absolute + barra absolute posicionada según template
- `full-image`: Link wrapping con gradiente para dots

## Archivos
- `supabase/migrations/00021_banner_slide_templates.sql` — migración
- `lib/definitions.ts` — `BannerSlide.template`, `Slide.template`
- `lib/actions/banner.ts` — leer/escribir template
- `components/HeroSlider.tsx` — reescritura
- `app/(protected)/admin/banner/banner-admin-client.tsx` — rediseño
- `app/(public)/page.tsx` — mapeo
