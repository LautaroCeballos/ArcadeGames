# Plan: Rediseño formulario de subida con Tags + Layout 2 columnas

## 1. Objetivo
Rediseñar la experiencia de subida de juegos para hacerla más intuitiva y fácil para niños:
- **Flujo**: Primero preguntar tipo de juego (Scratch/Arcade), luego mostrar el formulario
- **Layout**: 2 columnas como la página de juego (preview izquierda, inputs derecha)
- **Tags**: Reemplazar categoría única por sistema de tags múltiples. Primer tag = plataforma auto-asignado
- **Child-friendly**: Interfaz visual, colorida, con burbujas grandes, íconos, lenguaje simple

## 2. Contexto actual
- `SubmitGameForm` tiene toggle de plataforma inline, single-column layout
- Categorías: 10 en tabla `categories`, selección única via `<Select>`
- Tags: Tabla `tags` vacía, tabla `game_tags` lista para many-to-many
- `games.category_id` activo con FK a `categories`
- 8 juegos existentes, todos con `category_id` asignado
- Página de juego (`app/(public)/juego/[id]/page.tsx`) usa `lg:grid-cols-2` como referencia de layout

## 3. Problema
- Categoría única limita la organización (un juego puede ser "Arcade" Y "Multijugador")
- No hay forma de filtrar por plataforma (MakeCode vs Scratch) como categoría
- El formulario actual es funcional pero no invita a la exploración infantil
- Sin preview grande, los chicos no ven qué están subiendo hasta después

## 4. Resultado esperado
1. Al entrar a `/subir`, lo primero que ven es "¿Qué tipo de juego querés publicar?" con 2 cards visuales
2. Al elegir plataforma, aparece formulario 2 columnas (preview izquierda, inputs derecha)
3. Tags visuales: burbujas coloridas, multiselección, plataforma como tag fijo
4. Los juegos existentes mantienen su categoría migrada a tags
5. Búsqueda y filtrado funcionan con tags (incluyendo plataforma)

## 5. Restricciones y supuestos
- `games.id` es text PK (MakeCode short ID o `scratch_{numeric}`)
- No romper juegos existentes
- Tags reemplazan completamente a `category_id`
- La primera tag siempre es la plataforma (auto-asignada, no removible)
- Los 8 juegos existentes tienen `category_id` → migrar a `game_tags`
- Build debe compilar con 0 errores TS

## 6. Dirección visual
- **Paleta existente**: rojo `#d90057`, verde `#77b8a6`, beige `#ffe2ba`
- **Tono**: Playful pero limpio. Infantil sin ser infantilizado
- **Tags**: Cada tag con color propio, bordes redondeados, hover state
- **Tipografía**: Geist (ya en uso), mantenerla
- **Layout**: Espejo de la página de juego (`lg:grid-cols-2`)
- **Estados**: Loading (spinner en preview), error (mensaje amigable), empty (placeholder "Pegá la URL")

## 7. Skills y referencias a usar
- `frontend-design` — identidad visual cohesiva
- `wiki` — actualizar wiki post-implementación
- `tailwind-css-patterns` — layout grid responsive
- `next-best-practices` — server actions, form patterns

## 8. Arquitectura de implementación

### 8.1 DB Migration (`00005_tags_migration.sql`)
1. Seed `tags` con: "MakeCode Arcade", "Scratch", + 10 categorías existentes
2. Migrar `games.category_id` → `game_tags` (cada juego obtiene un tag con el nombre de su categoría)
3. Agregar tag de plataforma a cada juego según `games.platform`
4. Dropear columna `games.category_id`

### 8.2 TypeScript (`lib/definitions.ts`)
- Remover `category_id` de `Game` interface
- Remover `categories` de `GameWithDetails` (tags ya incluido)
- Actualizar `Database` types

### 8.3 Server Actions (`lib/actions/games.ts`)
- `createGame`: Aceptar `tag_ids[]`, auto-insertar platform tag, insert en `game_tags`
- `updateGame`: Aceptar `tag_ids[]`, reemplazar `game_tags` (delete all + insert)
- `getGames`: Soporte filtro por tag_ids
- `getGameById`: Ya trae tags, ok
- Remover toda referencia a `category_id`

### 8.4 Nuevo Componente: `TagPicker`
- Props: `tags: Tag[]`, `selectedIds: string[]`, `onChange: (ids: string[]) => void`, `lockedIds: string[]`, `max?: number`
- Visual: Grilla de burbujas coloridas seleccionables
- Colores asignados por posición (rotación de 8 colores)
- Tag locked se muestra como activa sin botón de remove

### 8.5 SubmitGameForm Rediseñado
- **Step 1**: Pantalla de selección de plataforma (antes de mostrar el form)
  - Título grande, dos cards visuales con ícono+nombre+descripción
  - Sin opciones extras, solo elegir plataforma
- **Step 2**: Aparece form 2 columnas:
  ```
  lg:grid lg:grid-cols-2 lg:gap-8
  ┌─────────────────────┬──────────────────────┐
  │   LEFT (sticky)     │   RIGHT              │
  │                     │                      │
  │   Preview embed     │   URL input          │
  │   (o placeholder)   │   Título             │
  │                     │   Descripción        │
  │   Tag cloud (tags   │   TagPicker          │
  │   del juego)        │   ThumbnailPicker    │
  │                     │   Submit button      │
  └─────────────────────┴──────────────────────┘
  ```
- URL cambia según plataforma (placeholder, hint, validación)
- Al pegar URL válida → preview en columna izquierda
- Submit button grande y visible

### 8.6 EditGameForm
- Reemplazar Select de categoría por TagPicker
- Cargar tags actuales del juego
- Auto-lock platform tag
- ThumbnailPicker condicional según plataforma

### 8.7 Páginas
- `subir/page.tsx`: fetch `tags` en vez de `categories`
- `editar/[id]/page.tsx`: fetch `tags`, pasar `game_tags` al form
- `juego/[id]/page.tsx`: ya usa `game.tags`, remover referencia a `categories`

## 9. Cambios por archivo

### Migración
| Archivo | Acción |
|---------|--------|
| `supabase/migrations/00005_tags_migration.sql` | **Crear**: seed tags, migrar datos, alter table |

### Types
| Archivo | Acción |
|---------|--------|
| `lib/definitions.ts` | **Editar**: remover `category_id` de `Game`, remover `categories` de `GameWithDetails` |

### Acciones
| Archivo | Acción |
|---------|--------|
| `lib/actions/games.ts` | **Editar**: `createGame` (tags), `updateGame` (tags), `getGames` (filtro tags), remover category_id |

### Componentes nuevos
| Archivo | Acción |
|---------|--------|
| `components/TagPicker.tsx` | **Crear**: visual multi-select tag picker |

### Componentes editados
| Archivo | Acción |
|---------|--------|
| `components/SubmitGameForm.tsx` | **Reescribir**: step flow + 2 columns + tags |
| `components/EditGameForm.tsx` | **Editar**: reemplazar categoría por TagPicker |
| `components/ScratchEmbed.tsx` | Sin cambios (ya funciona) |
| `components/ArcadeEmbed.tsx` | Sin cambios |

### Páginas
| Archivo | Acción |
|---------|--------|
| `app/(protected)/subir/page.tsx` | **Editar**: fetch tags |
| `app/(protected)/editar/[id]/page.tsx` | **Editar**: fetch tags + game_tags |
| `app/(public)/juego/[id]/page.tsx` | **Editar**: remover referencia categories, usar tags |

## 10. Componentes y contratos

### `TagPicker`
```tsx
interface TagPickerProps {
  tags: { id: string; name: string }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  lockedIds?: string[]
  max?: number
}
```

### `SubmitGameForm` (props cambian)
```tsx
// Antes:
interface SubmitGameFormProps { categories: { id: string; name: string }[] }
// Después:
interface SubmitGameFormProps { tags: { id: string; name: string }[] }
```

### `EditGameForm` (props cambian)
```tsx
// Antes:
interface EditGameFormProps { game: {...; category_id: string; ...}; categories: [...] }
// Después:
interface EditGameFormProps { game: {...; tags?: Tag[]; ...}; tags: Tag[]; ... }
```

## 11. Estados y comportamiento

### SubmitGameForm - Step 1 (Platform Selector)
| Estado | Comportamiento |
|--------|---------------|
| Default | 2 cards visuales, cursor pointer, hover elevation |
| Hover | Card se eleva (shadow + translateY), subtle |
| Focus | Outline visible (accesibilidad teclado) |
| Click | Animación de selección, transición a Step 2 |

### SubmitGameForm - Step 2 (Form)
| Estado | Comportamiento |
|--------|---------------|
| URL vacía | Preview muestra placeholder "Pegá la URL del juego" |
| URL inválida | Preview muestra error, hint rojo |
| URL válida | Preview embed se renderiza, campos restantes aparecen |
| URL válida + Scratch | Solo upload thumbnail |
| URL válida + MakeCode | Auto-thumbnail + upload |
| TagPicker empty | Grid de todas las tags, ninguna seleccionada |
| TagPicker selected | Tags seleccionadas con fill color, locked visible |
| Submit pending | Botón disabled con spinner, "Publicando..." |
| Submit error | Alerta roja con mensaje de error |
| Submit success | Redirección al perfil |

### TagPicker
| Estado | Comportamiento |
|--------|---------------|
| Unselected | Badge outline, cursor pointer |
| Selected | Badge filled (color), check icon |
| Locked | Badge filled, candado icon, no permite deseleccionar |
| Hover | Slight scale up, shadow |
| Max reached | Tags no seleccionadas se atenúan |

## 12. Responsive

### Desktop (≥1024px)
- `lg:grid lg:grid-cols-2 lg:gap-8`
- Left column: `lg:sticky lg:top-6 lg:self-start`
- Right column: scroll normal

### Tablet (640-1023px)
- Single column, preview arriba, inputs abajo
- TagPicker en grilla de 3-4 columnas
- Preview con max-width controlado

### Mobile (<640px)
- Single column
- TagPicker en grilla de 2 columnas
- Botones full-width
- Texto más grande para facilidad táctil

## 13. Accesibilidad
- Roles ARIA: `radiogroup` para platform selector, `listbox` para TagPicker
- Keyboard: Tab navigation, Enter/Space para seleccionar tags
- Labels: Todos los inputs con `<Label>` y `htmlFor`
- Status: `role="alert"` para errores
- Focus management: Auto-focus en URL input al cambiar de step
- Color: No depender solo de color para estado seleccionado (check icon)
- Touch: Targets ≥44px (TagPicker bubbles)

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Romper búsqueda existente por categoría | `getGames` recibe `tagIds[]` como parámetro, mantener retrocompatibilidad |
| Juegos existentes pierden categoría | Migración SQL transfiere category_id → game_tags + platform tag |
| TagPicker muy complejo para niños | Diseño visual, burbujas grandes, feedback táctil, locked tag visible |
| Step 1 → Step 2 transición abrupta | Animación CSS fade+slide, mantener coherencia visual |
| Build fails por cambios types | TS strict, verificar cada referencia a `category_id` |

## 15. Orden de ejecución

1. **Migración DB** (`00005_tags_migration.sql`) — seed + migrar datos + dropear columna
2. **Definitions** (`lib/definitions.ts`) — actualizar interfaces
3. **Actions** (`lib/actions/games.ts`) — `createGame` + `updateGame` + `getGames` con tags
4. **TagPicker** (`components/TagPicker.tsx`) — nuevo componente
5. **SubmitGameForm** (`components/SubmitGameForm.tsx`) — reescribir completo
6. **EditGameForm** (`components/EditGameForm.tsx`) — actualizar
7. **Páginas** — `subir`, `editar`, `juego/[id]`
8. **Build + fix errors** — `npm run build`
9. **Wiki update + commit**

## 16. Validación en navegador

- [ ] Step 1 → elegir MakeCode → Step 2 se muestra correctamente
- [ ] Step 1 → elegir Scratch → Step 2 cambia hints/placeholders
- [ ] Pegar URL MakeCode válida → preview arcade → tags disponibles
- [ ] Pegar URL Scratch válida → preview scratch → solo upload thumbnail
- [ ] TagPicker: seleccionar/deseleccionar tags
- [ ] TagPicker: locked tag no se puede remover
- [ ] Thumbnail upload funciona
- [ ] Submit con datos válidos → redirige a perfil
- [ ] Submit con error → alerta visible
- [ ] Desktop: 2 columnas correctas, sticky funciona
- [ ] Mobile: single column, touch targets cómodos
- [ ] Editar juego: tags precargadas
- [ ] Keyboard navigation: Tab por todo el form

## 17. Criterios de aceptación

- [ ] Al entrar a `/subir`, lo primero visible es la pregunta de plataforma (Step 1)
- [ ] Step 1 tiene exactamente 2 opciones: MakeCode Arcade y Scratch
- [ ] Al elegir una plataforma, se muestra el formulario 2 columnas (Step 2)
- [ ] La URL input cambia placeholder/hint según plataforma elegida
- [ ] Preview embed se muestra en columna izquierda al pegar URL válida
- [ ] Tags: se pueden seleccionar múltiples tags tipo burbuja
- [ ] Tags: "MakeCode Arcade" o "Scratch" aparece como primera tag locked
- [ ] Tags: al submit, se guardan en `game_tags`
- [ ] Juegos existentes mantienen su categoría como tag (migración exitosa)
- [ ] Editar juego: tags precargadas, se pueden cambiar
- [ ] Build: 0 errores TypeScript
- [ ] Sin regresión en búsqueda y listados
