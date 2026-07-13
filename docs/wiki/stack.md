---
title: "ArcadePlay — Tech Stack"
tags: [architecture, decision]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
---

# ArcadePlay — Tech Stack

## Stack completo

| Capa | Tecnología | Versión / Notas |
|------|-----------|----------------|
| Framework | Next.js (App Router) | 15+, Server Components por defecto |
| Lenguaje | TypeScript | strict mode |
| Estilos | Tailwind CSS v3 + shadcn/ui | new-york style, `cn()` en `lib/utils.ts` |
| Base de datos | Supabase Postgres | Con RLS policies |
| Autenticación | Supabase Auth | Email/password |
| Deploy | Vercel | Conectado vía GitHub |
| PM | pnpm | |

## Decisiones técnicas

### Next.js App Router
Se eligió App Router por su soporte nativo de Server Components, layouts anidados, y server actions. Permite mantener la lógica de negocio cerca de las pages sin exponerla al cliente.

### Supabase sobre Appwrite
El plan original del proyecto SART3 usaba Appwrite, pero ArcadePlay utiliza Supabase por:
- Mejor integración con Next.js (SSR package oficial, middleware)
- SQL nativo con RLS (políticas granulares por fila)
- Costo predecible en etapa MVP

### shadcn/ui
Componentos base accesibles y estilizados con Tailwind. Se elige new-york style por ser el estilo moderno por defecto. Ver [[architecture/components]] para el inventario de componentes.

### Email/password sobre OAuth social
Se prioriza simplicidad en MVP. El registro por email/password evita dependencias externas (Microsoft, Google). En futura versión se puede agregar OAuth. Ver [[auth/flow]].
