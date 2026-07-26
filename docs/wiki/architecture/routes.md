---
title: "ArcadePlay — Estructura de Rutas"
tags: [architecture, routes]
last_updated: "2026-07-26"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - docs/raw/plans/2026-07-23-notification-system.md
  - docs/raw/plans/2026-07-23-header-redesign-search.md
  - docs/raw/plans/2026-07-26-normalizar-tags-buscar.md
---

# ArcadePlay — Estructura de Rutas

## Layouts

- `app/layout.tsx` — Root layout: metadata base, fonts, Providers (Toaster, AuthListener)
- `app/(public)/layout.tsx` — Layout público: Navbar + footer
- `app/(protected)/layout.tsx` — Layout protegido: verifica sesión, Navbar con acceso a dashboard

## Rutas públicas `(public)`

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `page.tsx` | Home: HeroSlider + secciones curadas (Destacados, Categorías, Novedades) + Ranking + **Todos los juegos** (preview de 8 juegos + "Ver Más" a `/buscar?sort=recent`). Sin búsqueda ni filtros inline. |
| `/buscar` | `buscar/page.tsx` | Browse / Búsqueda. **Browse mode** (`?sort=` o `?tag=<slug>` sin `?q=`): grid completo con SortSelect + TagFilter + paginación (12 juegos/pág). Tags usan slugs en URL. **Búsqueda textual** (`?q=`): resultados multi-entidad (juegos, usuarios, tags). Sin params: browse mode activo (no empty state). |
| `/juego/[id]` | `juego/[id]/page.tsx` | Detalle del juego: embed, info, rating |
| `/perfil/[username]` | `perfil/[username]/page.tsx` | Perfil del usuario: header con stats (estrellas, juegos, seguidores/siguiendo), tabs Juegos (con gestión si es dueño) y Logros |
| `/login` | `login/page.tsx` | Formulario de inicio de sesión |
| `/signup` | `signup/page.tsx` | Formulario de registro |

## Rutas protegidas `(protected)`

Requieren sesión activa. Redirigen a `/login` si no hay sesión.

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/subir` | `subir/page.tsx` | Formulario para publicar un juego (URL de MakeCode) |
| `/dashboard` | `dashboard/page.tsx` | Redirige a `/perfil/{username}` (el perfil propio ahora reemplaza al dashboard) |
| `/cuenta` | `cuenta/page.tsx` | Administrar cuenta: info del registro, editar perfil (avatar, username, bio, fecha, país), cambiar contraseña |
| `/editar/[id]` | `editar/[id]/page.tsx` | Editar juego: modificar título, descripción, categoría y miniatura |
| `/moderar` | `moderar/page.tsx` | Panel de moderación: revisar, aprobar y rechazar juegos (moderador/admin) |
| `/admin/usuarios` | `admin/usuarios/page.tsx` | Administración de usuarios: asignar roles (solo admin) |
| `/admin/banner` | `admin/banner/page.tsx` | Administración del banner del home: gestionar slides (solo admin) |
| `/notificaciones` | `notificaciones/page.tsx` | Historial completo de notificaciones del usuario |

## Middleware

`middleware.ts` se encarga de:
1. Refrescar la sesión de Supabase en cada request
2. Redirigir a `/login` si se accede a rutas protegidas sin sesión
3. Setear cookies de sesión (`sb-` prefixed cookies)

Implementado con `@supabase/ssr` siguiendo el patrón de Supabase Auth Helpers para Next.js.
