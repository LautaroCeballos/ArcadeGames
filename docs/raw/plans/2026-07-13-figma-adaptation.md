# Plan: Adaptación del Frontend al Diseño Figma ArcadePlay

## 1. Objetivo
Adaptar el frontend actual de ArcadePlay (shadcn/ui default, neutro) al diseño propuesto en Figma: identidad visual arcade/retro con paleta rojo neón (`#d90057`), verde pastel (`#77b8a6`) y beige (`#ffe2ba`), incluyendo header, hero slider, secciones curadas, game cards, rankings, footer y página de juego.

## 2. Contexto actual
- **Frontend**: Next.js App Router + Tailwind CSS v4 + shadcn/ui (tema neutral)
- **Tipografía**: Geist Sans/Mono via next/font
- **Homepage**: SearchBar + CategoryFilter + GameGrid con LoadMoreGames
- **Componentes**: Navbar (border-b), GameCard (shadcn Card), footer minimalista
- **Backend**: Supabase con tablas `games` (incluye `views`), `ratings`, `profiles`, `categories`
- **Sin diseño propio**: Tema default de shadcn, sin identidad visual

## 3. Problema
El frontend actual no tiene personalidad ni coherencia visual con una plataforma de juegos arcade. No hay hero section, no hay secciones curadas, no hay rankings, y la paleta de colores es genérica.

## 4. Resultado esperado
Homepage con:
- Header rojo (#d90057) con logo + íconos de navegación
- Hero slider con imágenes destacadas y CTA "Saber Más"
- Secciones horizontales: Últimos Juegos, Más Jugados, Mejor Valorados
- Game Cards con thumbnail, overlay oscuro, título, rating
- Sección de Ranking/Top Jugadores con cards de períodos + podio
- Footer rojo con links organizados en columnas
- Página de juego detalle adaptada a la nueva paleta

## 5. Restricciones y supuestos
- Mantener Geist como tipografía principal (no Roboto del Figma)
- Los íconos del Figma (SVGs) se reemplazarán con lucide-react
- El logo del Figma (imagen) se reemplazará con texto estilizado
- No hay datos reales de ranking de jugadores aún → se usa la tabla `ratings` para ranking de juegos y se deja estructura preparada para ranking de jugadores
- Slider de anuncios: usaremos datos mockeados inicialmente (configurables después)
- No se requiere carrusel con arrastre nativo por ahora; usaremos overflow-x scroll con CSS
- Las imágenes de los juegos vienen de MakeCode Arcade (thumbnail_url)

## 6. Dirección visual
- **Inspiración**: Arcade retro, neón sobre fondos oscuros, pero versión web limpia
- **Paleta**:
  - `#d90057` (Rojo neón) — Header, Footer, acentos, botones, headers de ranking
  - `#77b8a6` (Verde pastel) — Backgrounds secundarios, fondos de ranking cards
  - `#ffe2ba` (Beige claro) — Texto sobre fondos oscuros, badges
  - `#343635` (Gris oscuro) — Texto principal sobre fondo blanco
  - Fondo general: blanco `#ffffff`
- **Tipografía**: Geist Sans (existing), SemiBold para títulos
- **Formas**: Border-radius 10px en cards, 15px en botones
- **Sin fondos genéricos**: Cada sección tiene propósito visual claro

## 7. Skills y referencias a usar
- **frontend-design**: Guías de diseño visual, dirección estética bold
- **tailwind-css-patterns**: Patrones responsive, grid, flexbox
- **next-best-practices**: Server components, data fetching patterns
- **supabase**: Queries para datos curados (más jugados, mejor valorados)

## 8. Arquitectura de implementación

### Design Tokens (CSS Variables)
Se agregarán a `globals.css` sobreescribiendo los valores de shadcn:
```css
:root {
  --arcade-red: #d90057;
  --arcade-green: #77b8a6;
  --arcade-beige: #ffe2ba;
  --arcade-dark: #343635;
  /* shadcn tokens re-mapped */
  --primary: var(--arcade-red);
  --primary-foreground: var(--arcade-beige);
  /* etc */
}
```

### Nuevos Server Actions
- `lib/actions/games.ts`: Agregar `getRecentGames()`, `getMostPlayed()`, `getTopRated()`
- `lib/actions/ratings.ts`: Agregar `getRankings()` para ranking de juegos por rating

### Nuevos Componentes
```
components/
  ui/              (existing)
  Navbar.tsx       → MODIFICAR (rojo con íconos)
  HeroSlider.tsx   → NUEVO
  GameThumbnail.tsx → NUEVO (miniatura con overlay)
  CuratedSection.tsx → NUEVO (sección horizontal)
  GameCard.tsx     → MODIFICAR (nuevo diseño)
  RankingSection.tsx → NUEVO
  PodiumCard.tsx   → NUEVO
  Footer.tsx       → NUEVO (reemplazar footer inline)
```

### Modificaciones de página
- `app/(public)/page.tsx` → Rediseño completo con secciones
- `app/(public)/layout.tsx` → Footer separado
- `app/(public)/juego/[id]/page.tsx` → Adaptar colores
- `app/globals.css` → Nueva paleta de colores

## 9. Cambios por archivo

### `app/globals.css`
- Reemplazar valores de variables CSS con la nueva paleta
- Mantener estructura @theme inline de Tailwind v4
- Mapear colores: primary→#d90057, primary-foreground→#ffe2ba, etc.

### `app/(public)/layout.tsx`
- Reemplazar footer inline por componente `<Footer />`

### `app/(public)/page.tsx`
Reemplazar contenido actual por:
1. `<HeroSlider />` — Slider de anuncios destacados
2. `<CuratedSection title="Últimos Juegos" ... />` — Últimos agregados
3. `<CuratedSection title="Más Jugados" ... />` — Por views
4. `<CuratedSection title="Mejor Valorados" ... />` — Por avg_rating
5. `<RankingSection />` — Top jugadores/rankings
6. (Opcional) SearchBar + CategoryFilter al final o en header

### `components/Navbar.tsx`
- Fondo: `bg-[#d90057]`
- Texto logo: beige, bold
- Links de navegación inline
- Botones: search (lupa), upload (subir), user (perfil) con lucide-react icons
- Versión mobile: menú hamburguesa

### `components/HeroSlider.tsx` (NUEVO)
- Client component con useState para slide activo
- Slider de imágenes destacadas (mock data inicial)
- Botón "Saber Más" (`bg-[#d90057] text-[#ffe2ba] rounded-[15px]`)
- Dots de navegación inferiores
- Auto-rotación cada 5 segundos
- Responsive: altura adaptativa

### `components/GameThumbnail.tsx` (NUEVO)
- Imagen 16:9 con `object-cover`
- Overlay oscuro (`bg-[rgba(52,54,53,0.96)]`) en parte inferior (~30%)
- Título en beige, puntuación con estrella
- `rounded-[10px]` overflow-hidden
- Hover: leve scale (1.02) con transition

### `components/CuratedSection.tsx` (NUEVO)
- Título de sección en gris oscuro, SemiBold
- Contenedor horizontal con `overflow-x-auto` y `scroll-snap`
- 4+ GameThumbnail items
- Flechas de navegación laterales (opcional)
- Responsive: 2 items en mobile, 4 en desktop

### `components/GameCard.tsx` (MODIFICAR)
- Actualmente: shadcn Card con thumbnail, título, username, rating
- Pasar a usar el estilo de GameThumbnail
- Mantener link a `/juego/[id]`

### `components/RankingSection.tsx` (NUEVO)
- Server component que consulta rankings
- Grid de 4 cards: Ayer, Semana, Mes, Año
- Card verde (`bg-[#77b8a6]`) con header rojo
- Cada card: 3 jugadores con avatar, nombre, puntos, estrella
- Podio central (imagen decorativa)
- Título "TOP de Jugadores"

### `components/Footer.tsx` (NUEVO)
- Fondo: `bg-[#d90057]`
- Logo centrado (texto estilizado)
- Dos columnas de links:
  - Columna 1: MakeCode Arcade, Agregar juegos, Categorías
  - Columna 2: Iniciar Sesión, Sobre ArcadePlay, Términos y Condiciones
- Texto: `text-[#ffe2ba]`

### `app/(public)/juego/[id]/page.tsx`
- Ajustar colores de badges, separators, textos
- Botones de rating con estilo arcade

## 10. Componentes y contratos

```typescript
// HeroSlider
interface Slide {
  id: string
  imageUrl: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
}

// GameThumbnail
interface GameThumbnailProps {
  game: Pick<GameWithDetails, "id" | "title" | "thumbnail_url" | "avg_rating">
}

// CuratedSection
interface CuratedSectionProps {
  title: string
  games: GameThumbnailProps["game"][]
}

// RankingCard
interface RankingEntry {
  username: string
  avatarUrl: string | null
  score: number
}

// RankingSection
interface RankingPeriod {
  label: string // "Ayer" | "Semana" | "Mes" | "Año"
  entries: RankingEntry[]
  isDouble?: boolean
}

// Footer
interface FooterLink {
  label: string
  href: string
}
```

## 11. Estados y comportamiento

### HeroSlider
- **Loading**: Skeleton con aspect-ratio 16:7
- **Empty**: Mensaje "Próximamente"
- **Active slide**: Imagen + botón visibles
- **Transición**: Fade entre slides
- **Auto-play**: Timer 5s, pausa en hover

### GameThumbnail
- **Normal**: Imagen + overlay inferior con info
- **Hover**: Scale 1.02, shadow elevado
- **Loading**: Skeleton aspect-video
- **Error image**: Placeholder con icono gamepad
- **Empty state**: No se muestra (filtrado en padre)

### CuratedSection
- **Loading**: 4 skeletons en fila
- **Empty**: Mensaje "No hay juegos aún"
- **Scroll**: horizontal nativo con snap
- **Overflow**: Scrollbar fina y estilizada (webkit)

### RankingSection
- **Loading**: 4 skeleton cards
- **Empty**: Cards sin datos
- **Real data**: Cuando existan suficientes ratings

### Navbar
- **Scrolled**: Sombra sutil al hacer scroll
- **Mobile**: Menú hamburguesa con overlay
- **Active**: Link activo highlight

### Footer
- **Hover links**: Subrayado o cambio de opacidad

## 12. Responsive

| Breakpoint | Header | Hero | Curated | Ranking | Footer |
|-----------|--------|------|---------|---------|--------|
| **375px** | Logo + hamburguesa | Altura reducida, texto CTA pequeño | 1 columna | 1 card por row | 1 columna |
| **640px** | Íconos visibles | Normal | 2 items | 2 cards | 2 columnas |
| **768px** | Íconos + texto | Normal | 3 items | 2 cards + podio | 2 columnas |
| **1024px** | Full | Normal | 4 items | 4 cards grid | 2 columnas |
| **1280px+** | Full | Máximo | 4+ items | Grid completo | 2 columnas |

## 13. Accesibilidad
- Contraste suficiente: `#d90057` sobre `#ffe2ba` cumple WCAG AA (proporción ~5.5:1)
- Texto beige sobre rojo: verificar contraste mínimo 4.5:1
- Alt text en todas las imágenes de juegos
- Roles ARIA en slider (`role="region"`, `aria-roledescription="carousel"`)
- Navegación por teclado en slider (flechas left/right)
- Focus visible en todos los botones interactivos
- Skip to content link

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Datos de ranking insuficientes | Preparar estructura con datos mock, luego reemplazar con reales cuando haya usuarios |
| Imágenes de MakeCode no disponibles | Placeholder con icono gamepad + manejo de error en img |
| Performance con muchas imágenes lazy | Usar `loading="lazy"` nativo en todas las img |
| Overlay oscuro no se ve en thumbnails claros | Usar gradiente oscuro en lugar de color sólido para mejor blending |
| Scroll horizontal no intuitivo en mobile | Mostrar indicadores visuales de scroll (fade edges) |
| El slider de anuncios no tiene CMS | Datos mockeados, extraer a configuración/env después |

## 15. Orden de ejecución

### Fase 1: Design Tokens + Theme (~30min)
1. `app/globals.css` — Nueva paleta de colores
2. Verificar que los componentes shadcn se vean bien con los nuevos tokens

### Fase 2: Navbar (~30min)
1. `components/Navbar.tsx` — Rediseño completo
2. Iconos con lucide-react (search, upload, user, menu)
3. Responsive: menú hamburguesa en mobile

### Fase 3: Footer (~15min)
1. `components/Footer.tsx` — Nuevo componente
2. `app/(public)/layout.tsx` — Reemplazar footer inline

### Fase 4: Server Actions (~20min)
1. `lib/actions/games.ts` — Agregar `getRecentGames()`, `getMostPlayed()`, `getTopRated()`
2. Verificar tipos y counts

### Fase 5: GameThumbnail + CuratedSection (~45min)
1. `components/GameThumbnail.tsx` — Nuevo componente de thumbnail
2. `components/CuratedSection.tsx` — Sección horizontal
3. `components/GameCard.tsx` — Adaptar al nuevo estilo

### Fase 6: Homepage (~30min)
1. `app/(public)/page.tsx` — Rediseño con HeroSlider + secciones curadas

### Fase 7: HeroSlider (~40min)
1. `components/HeroSlider.tsx` — Slider con auto-play, dots, CTA
2. Datos mock para anuncios

### Fase 8: RankingSection (~45min)
1. `components/RankingSection.tsx` — Grid de rankings
2. `components/PodiumCard.tsx` — Podio central
3. Datos mock para rankings

### Fase 9: Game Detail Page (~20min)
1. `app/(public)/juego/[id]/page.tsx` — Adaptar colores y estilos

### Fase 10: Polish + Validación (~30min)
1. Animaciones y transiciones
2. Prueba responsive (375px, 768px, 1024px, 1440px)
3. Validación con chrome-devtools
4. Ajustes finales

## 16. Validación en navegador

Para cada fase:
1. Abrir en Chrome DevTools
2. Verificar layout en 375px, 768px, 1024px, 1440px
3. Verificar contraste de colores (DevTools → Rendering → Accessibility)
4. Verificar hover/focus states
5. Verificar scroll horizontal en curated sections
6. Verificar auto-play y pausa del slider
7. Verificar que no hay overflow horizontal no deseado
8. Console: 0 errores, 0 warnings
9. Lighthouse: Accessibility ≥ 90

## 17. Criterios de aceptación

- [ ] Paleta de colores Figma aplicada consistentemente en toda la app
- [ ] Header rojo con logo, íconos de navegación y menú responsive
- [ ] Hero slider funcional con auto-play, dots, y CTA button
- [ ] Secciones curadas (Últimos, Más Jugados, Mejor Valorados) con scroll horizontal
- [ ] Game thumbnails con overlay oscuro, título y rating
- [ ] Sección de ranking con cards de períodos y podio
- [ ] Footer rojo con links en columnas
- [ ] Página de juego detalle con colores adaptados
- [ ] Responsive: 375px, 768px, 1024px, 1440px sin roturas
- [ ] Sin errores de consola
- [ ] Contraste WCAG AA en todos los textos
- [ ] Todos los componentes usan Geist como tipografía
- [ ] Diseño coherente con identidad arcade, no genérico
