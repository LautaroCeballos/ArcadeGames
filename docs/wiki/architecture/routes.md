---
title: "ArcadePlay — Estructura de Rutas"
tags: [architecture, routes]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
---

# ArcadePlay — Estructura de Rutas

## Layouts

- `app/layout.tsx` — Root layout: metadata base, fonts, Providers (Toaster, AuthListener)
- `app/(public)/layout.tsx` — Layout público: Navbar + footer
- `app/(protected)/layout.tsx` — Layout protegido: verifica sesión, Navbar con acceso a dashboard

## Rutas públicas `(public)`

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `page.tsx` | Home: grid de juegos con búsqueda y filtro de categorías |
| `/juego/[id]` | `juego/[id]/page.tsx` | Detalle del juego: embed, info, rating |
| `/perfil/[username]` | `perfil/[username]/page.tsx` | Perfil público del usuario con sus juegos |
| `/login` | `login/page.tsx` | Formulario de inicio de sesión |
| `/signup` | `signup/page.tsx` | Formulario de registro |

## Rutas protegidas `(protected)`

Requieren sesión activa. Redirigen a `/login` si no hay sesión.

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/subir` | `subir/page.tsx` | Formulario para publicar un juego (URL de MakeCode) |
| `/dashboard` | `dashboard/page.tsx` | Panel de gestión: listado y control de juegos propios |

## Middleware

`middleware.ts` se encarga de:
1. Refrescar la sesión de Supabase en cada request
2. Redirigir a `/login` si se accede a rutas protegidas sin sesión
3. Setear cookies de sesión (`sb-` prefixed cookies)

Implementado con `@supabase/ssr` siguiendo el patrón de Supabase Auth Helpers para Next.js.
