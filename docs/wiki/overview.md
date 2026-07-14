---
title: "ArcadePlay — Visión General"
tags: [concept]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - docs/raw/plans/2026-07-13-figma-adaptation.md
---

# ArcadePlay — Visión General

## Concepto

Plataforma web estilo arcade portal (ej. juegosdiarios.com) enfocada exclusivamente en juegos de **MakeCode Arcade**. Los usuarios pueden publicar y jugar juegos mediante iframes embebidos.

## Audiencia

- Creadores de juegos MakeCode Arcade (estudiantes, docentes, entusiastas)
- Jugadores que buscan juegos retro livianos desde el navegador

## Diferenciación

- No se suben archivos — los juegos se referencian por URL de MakeCode
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

Proyecto en etapa de desarrollo activo. La homepage se está rediseñando para adaptarse al diseño Figma, con nuevas secciones: Hero Slider, secciones curadas (Últimos, Más Jugados, Mejor Valorados), Ranking de jugadores y Footer rediseñado.
Ver el plan en `docs/raw/plans/2026-07-13-figma-adaptation.md`.
