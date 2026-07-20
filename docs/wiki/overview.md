---
title: "ArcadePlay — Visión General"
tags: [concept]
last_updated: "2026-07-20"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - docs/raw/plans/2026-07-13-figma-adaptation.md
  - docs/raw/plans/2026-07-20-submit-form-dual-platform.md
---

# ArcadePlay — Visión General

## Concepto

Plataforma web estilo arcade portal (ej. juegosdiarios.com) enfocada en juegos de **MakeCode Arcade** y **Scratch**. Los usuarios pueden publicar y jugar juegos de ambas plataformas mediante iframes embebidos.

## Audiencia

- Creadores de juegos MakeCode Arcade y Scratch (estudiantes, docentes, entusiastas)
- Jugadores que buscan juegos retro livianos desde el navegador

## Diferenciación

- No se suben archivos — los juegos se referencian por URL de MakeCode o Scratch
- Curado: solo juegos aprobados son públicos
- Liviano: sin leaderboards, analytics, ni challenges (postergado a futura versión)

## Diseño visual

El diseño está definido en Figma (archivo `ArcadePlay`) con una paleta distintiva:
- **Rojo neón** `#d90057` — Header, Footer, acentos
- **Verde pastel** `#77b8a6` — Fondos secundarios
- **Beige** `#ffe2ba` — Texto sobre fondos oscuros

Ver [[frontend/design-tokens]] para el sistema de diseño completo.

## Stack principal

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js (App Router, Server Components) |
| Lenguaje | TypeScript strict |
| Estilos | Tailwind CSS v4 + shadcn/ui (re-themeado según [[frontend/design-tokens]]) |
| Iconos | lucide-react |
| Diseño UI | Figma |
| Backend | Supabase (Postgres + Auth) |
| Deploy | Vercel |

Ver [[stack]] para detalle completo.

## Estado actual

Proyecto en etapa de desarrollo activo. La homepage se rediseñó para adaptarse al diseño Figma (Hero Slider, secciones curadas, Ranking, Footer). El formulario de subida soporta **MakeCode Arcade** y **Scratch** con toggle de plataforma, preview condicional y validación dual.
Ver los planes en `docs/raw/plans/2026-07-13-figma-adaptation.md` y `docs/raw/plans/2026-07-20-submit-form-dual-platform.md`.
