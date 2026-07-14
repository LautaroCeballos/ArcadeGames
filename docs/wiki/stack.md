---
title: "ArcadePlay — Tech Stack"
tags: [architecture, decision]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - package.json
---

# ArcadePlay — Tech Stack

## Stack completo

| Capa | Tecnología | Versión / Notas |
|------|-----------|----------------|
| Framework | Next.js (App Router) | 16.2.10, Server Components por defecto |
| Lenguaje | TypeScript | 5.9 strict mode |
| Estilos | Tailwind CSS v4 + shadcn/ui | new-york style, `cn()` en `lib/utils.ts` |
| Diseño UI | Figma (archivo `ArcadePlay`) | Design tokens en [[frontend/design-tokens]] |
| Iconos | lucide-react | |
| Base de datos | Supabase Postgres | Con RLS policies |
| Autenticación | Supabase Auth | Email/password |
| Deploy | Vercel | Conectado vía GitHub |
| PM | pnpm | 9.15.9 |

## Decisiones técnicas

### Next.js App Router
Se eligió App Router por su soporte nativo de Server Components, layouts anidados, y server actions. Permite mantener la lógica de negocio cerca de las pages sin exponerla al cliente.

### Supabase sobre Appwrite
El plan original del proyecto SART3 usaba Appwrite, pero ArcadePlay utiliza Supabase por:
- Mejor integración con Next.js (SSR package oficial, middleware)
- SQL nativo con RLS (políticas granulares por fila)
- Costo predecible en etapa MVP

### shadcn/ui + Design System Figma
Componentes base accesibles y estilizados con Tailwind. El tema visual está definido por el diseño en Figma (archivo `ArcadePlay`), con paleta de colores rojo neón (`#d90057`), verde pastel (`#77b8a6`) y beige (`#ffe2ba`). Los tokens de shadcn se re-mapean a esta paleta.
Ver [[frontend/design-tokens]] para el sistema de diseño completo.
Ver [[frontend/components]] para el inventario de componentes.

### Email/password sobre OAuth social
Se prioriza simplicidad en MVP. El registro por email/password evita dependencias externas (Microsoft, Google). En futura versión se puede agregar OAuth. Ver [[auth/flow]].

### Tailwind v4
El proyecto usa Tailwind CSS v4 con `@import "tailwindcss"` y `@theme inline` para definir tokens, en lugar de `tailwind.config.ts`. Las variables CSS de shadcn se definen en `app/globals.css` como propiedades CSS nativas y se referencian desde el bloque `@theme inline`.
