---
title: "ArcadePlay — Visión General"
tags: [concept]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
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

## Stack principal

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js (App Router, Server Components) |
| Lenguaje | TypeScript strict |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Postgres + Auth) |
| Deploy | Vercel |

Ver [[stack]] para detalle completo.

## Estado actual

Proyecto en etapa inicial — greenfield. La especificación completa está en `docs/raw/plans/makecode_arcade_platform_FULL.md`.
