---
title: "ArcadePlay — Design Tokens y Sistema Visual"
tags: [frontend, design, concept]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/2026-07-13-figma-adaptation.md
  - app/globals.css
---

# ArcadePlay — Design Tokens y Sistema Visual

Sistema de diseño basado en la maqueta de Figma (Archivo: `ArcadePlay`, node `Desktop - 1`).

## Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--arcade-red` | `#d90057` | Header, Footer, botones primarios, acentos, headers de ranking |
| `--arcade-green` | `#77b8a6` | Fondos secundarios, fondos de ranking cards |
| `--arcade-beige` | `#ffe2ba` | Texto sobre fondos oscuros, badges |
| `--arcade-dark` | `#343635` | Texto principal sobre fondo claro, overlays |

### Mapeo a shadcn/ui

Los tokens de shadcn se re-mapean a la paleta arcade:

| shadcn token | Color |
|-------------|-------|
| `--primary` | `#d90057` (rojo neón) |
| `--primary-foreground` | `#ffe2ba` (beige) |
| `--secondary` | `#77b8a6` (verde pastel) |
| `--secondary-foreground` | `#ffffff` |
| `--muted` | `#77b8a6` |
| `--muted-foreground` | `#343635` |
| `--background` | `#ffffff` |
| `--foreground` | `#343635` |
| `--border` | Derivado del contexto |

Implementado en `app/globals.css` mediante CSS variables con `@theme inline` de Tailwind v4.

## Tipografía

| Propiedad | Valor |
|-----------|-------|
| Fuente principal | **Geist Sans** (via `next/font`) |
| Fuente mono | **Geist Mono** (via `next/font`) |
| Títulos de sección | SemiBold, 25px |
| Texto en thumbnails | SemiBold, 20px |
| Texto cuerpo | Geist Sans regular, 14-16px |

> [!note] El diseño Figma usa Roboto SemiBold, pero se mantiene Geist por coherencia con el stack actual y mejor performance con `next/font`.

## Radios y spacing

| Elemento | Border-radius |
|----------|---------------|
| Botones CTA | 15px |
| Cards (Ranking, Thumbnails) | 10px |
| Inputs y campos | 8px (shadcn default) |
| Badges | 4px (shadcn default) |

## Componentes visuales del diseño Figma

### Header
- Fondo: `#d90057` (rojo neón), altura 166px
- Logo: rectangular, 274×142px
- 3 botones ícono: búsqueda (fondo beige redondeado), subir, usuario
- Implementado en [[frontend/components]] como `Navbar.tsx`

### Hero Slider
- Contenedor con imagen destacada de 1164×308px
- Botón "SABER MAS" rectangular rojo con border-radius 15px
- Dots de navegación (elipses, 18×18px)
- Altura total: 368px

### Miniatura de Juego (GameThumbnail)
- Imagen 16:9 (251×179px en diseño)
- Overlay oscuro `rgba(52,54,53,0.96)` cubriendo ~29% inferior
- Título en beige, puntuación con icono estrella
- Border-radius 10px

### Secciones Curadas
- Título en `#343635`, 25px SemiBold
- 4 thumbnails en fila horizontal con scroll
- Secciones: "Ultimos Juegos", "Mas Jugados", "Mejor Valorados"

### Ranking
- Cards verdes sólidos (`bg-arcade-green`, `#77b8a6`) con header rojo (`#d90057`)
- Layout:
  - Fila 1: Ayer (1/3) | Podio (1/3) | Semana (1/3)
  - Fila 2: Mes (doble, 2 columnas de 3 entries) | Año (doble)
- Entries: avatar/trofeo circular (size-11 sm:size-12), nombre en beige, score en rojo + estrella amarilla
- Períodos: Ayer, Semana (3 entries), Mes, Año (6 entries en 2 columnas)
- Podio: top 3 global con trofeos oro/plata/bronce, mismo formato visual que las ranking cards
- Sombras suaves en cards: `shadow-[0_2px_8px_rgba(0,0,0,0.07)]`

### Footer
- Fondo: `#d90057` (rojo neón), altura 241px
- Logo centrado (274×142px)
- Dos columnas de links en beige (`#ffe2ba`)
- Columna izquierda: MakeCode Arcade, Agregar juegos, Categorías
- Columna derecha: Iniciar Sesión, Sobre ArcadePlay, Términos y Condiciones

## Dirección visual

- **Inspiración**: Arcade retro / neón sobre fondos oscuros, versión web limpia
- **Tono**: Juguetón pero no infantil. Colores vibrantes con intención
- **Diferenciación**: Paleta rojo-verde-beige distintiva, lejos del diseño neutral genérico
- **Responsive**: Adaptación de 1440px (desktop) hasta 375px (mobile)

Ver el plan de implementación completo en `docs/raw/plans/2026-07-13-figma-adaptation.md`.
