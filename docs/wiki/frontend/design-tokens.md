---
title: "ArcadePlay — Design Tokens y Sistema Visual"
tags: [frontend, design, concept]
last_updated: "2026-07-26"
sources:
  - docs/raw/plans/2026-07-13-figma-adaptation.md
  - app/globals.css
---

# ArcadePlay — Design Tokens y Sistema Visual

Sistema de diseño basado en la maqueta de Figma (Archivo: `ArcadePlay`, node `Desktop - 1`), adaptado a una paleta púrpura moderna con soporte light/dark.

## Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--arcade-red` | `#8b5cf6` | Header, Footer, botones primarios, acentos, links |
| `--arcade-green` | `#34d399` | Éxito, badges de estado, anillos de avatar, acentos secundarios |
| `--arcade-beige` | `#ffffff` (light) / `#f0f0f0` (dark) | Texto sobre fondos de color (navbar, footer) |
| `--arcade-dark` | `#111827` (light) / `#f0f0f0` (dark) | Texto principal sobre fondos claros/oscuros, headings |

### Mapeo a shadcn/ui

Los tokens de shadcn se re-mapean a la paleta púrpura:

| shadcn token | Light | Dark |
|-------------|-------|------|
| `--primary` | `#8b5cf6` (púrpura) | `#8b5cf6` (púrpura) |
| `--primary-foreground` | `#ffffff` (blanco) | `#ffffff` (blanco) |
| `--secondary` | `#f3f4f6` (gris claro) | `#16162a` (púrpura oscuro) |
| `--secondary-foreground` | `#111827` (gris oscuro) | `#a78bfa` (púrpura claro) |
| `--muted` | `#f3f4f6` | `#16162a` |
| `--muted-foreground` | `#6b7280` | `#a0a0b0` |
| `--accent` | `#ede9fe` (púrpura claro) | `#8b5cf6` |
| `--accent-foreground` | `#8b5cf6` | `#ffffff` |
| `--background` | `#ffffff` | `#0a0a0f` (azul/púrpura muy oscuro) |
| `--foreground` | `#111827` | `#f0f0f0` |
| `--card` | `#ffffff` | `#16162a` |
| `--border` | `#e5e7eb` | `#2a2a4a` |
| `--ring` | `#8b5cf6` | `#8b5cf6` |

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
- Fondo: `#8b5cf6` (púrpura), altura 166px
- Logo: rectangular, 274×142px
- 3 botones ícono: búsqueda (fondo claro redondeado), subir, usuario
- Implementado en [[frontend/components]] como `Navbar.tsx`

### Hero Slider
- Contenedor con imagen destacada de 1725×910px (desktop) / 4:3 (mobile)
- Botón "SABER MAS" rectangular púrpura con border-radius 15px
- Dots de navegación (elipses, 18×18px)
- Altura total: 368px

### Miniatura de Juego (GameThumbnail)
- Imagen 16:9 (251×179px en diseño)
- Overlay oscuro `rgba(52,54,53,0.96)` cubriendo ~29% inferior
- Título en claro, puntuación con icono estrella
- Border-radius 10px

### Secciones Curadas
- Título en `#111827`, 25px SemiBold
- 4 thumbnails en fila horizontal con scroll
- Secciones: "Ultimos Juegos", "Mas Jugados", "Mejor Valorados"

### Ranking
- Cards oscuras (`bg-card`) con shadow suave
- Layout:
  - Fila 1: Ayer (1/3) | Podio (1/3) | Semana (1/3)
  - Fila 2: Mes (doble, 2 columnas de 3 entries) | Año (doble)
- Entries: avatar/trofeo circular (size-11 sm:size-12), nombre en foreground, score con estrella amarilla
- Períodos: Ayer, Semana (3 entries), Mes, Año (6 entries en 2 columnas)
- Podio: top 3 global con trofeos oro/plata/bronce, mismo formato visual que las ranking cards
- Sombras suaves en cards: `shadow-[0_2px_8px_rgba(0,0,0,0.07)]`

### Footer
- Fondo: `#8b5cf6` (púrpura), altura 241px
- Logo centrado (274×142px)
- Dos columnas de links en blanco (`#ffffff`)
- Columna izquierda: MakeCode Arcade, Agregar juegos, Categorías
- Columna derecha: Iniciar Sesión, Sobre ArcadePlay, Términos y Condiciones

## Dirección visual

- **Inspiración**: Arcade retro / neón sobre fondos oscuros, versión web limpia con paleta púrpura moderna
- **Tono**: Juguetón pero no infantil. Púrpura vibrante con acentos esmeralda
- **Diferenciación**: Paleta púrpura-esmeralda distintiva, lejos del diseño neutral genérico
- **Modo oscuro**: Fondo muy oscuro (`#0a0a0f`) con cards púrpura profundo (`#16162a`)
- **Modo claro**: Fondo blanco con acentos púrpura y bordes gris claro
- **Responsive**: Adaptación de 1440px (desktop) hasta 375px (mobile)

Ver el plan de implementación completo en `docs/raw/plans/2026-07-13-figma-adaptation.md`.
