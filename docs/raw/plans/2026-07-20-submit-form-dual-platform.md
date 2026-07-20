# Plan: Formulario de subida dual (MakeCode + Scratch)

## 1. Objetivo
Rediseñar el formulario de subida de juegos para soportar dos plataformas: **MakeCode Arcade** (existente) y **Scratch** (nuevo). La interfaz debe ser intuitiva, con una clara separación visual entre ambas secciones, manteniendo la coherencia visual del proyecto ArcadePlay.

## 2. Contexto actual
- El formulario actual (`SubmitGameForm`) solo acepta URLs de MakeCode Arcade.
- La tabla `games` no tiene distinción de plataforma.
- No existe lógica para extraer IDs de proyectos Scratch ni construir sus embeds.
- El embed se renderiza con `ArcadeEmbed` (iframe 4:3).
- La página de juego (`juego/[id]`) usa `GameTabs` que asume MakeCode.

## 3. Problema
No hay soporte para juegos de Scratch, lo que limita el tipo de contenido que los usuarios pueden compartir en ArcadePlay. El formulario actual es funcional pero no comunica claramente que solo soporta MakeCode, y no hay indicación visual de qué otro tipo de juegos se podrían subir.

## 4. Resultado esperado
- Un formulario con dos modos seleccionables: **MakeCode Arcade** y **Scratch**.
- Cada modo muestra su propia sección de URL con validación y preview.
- Los campos comunes (título, descripción, categoría) se comparten.
- Los juegos de Scratch se renderizan correctamente en la página de detalle.
- El tipo de plataforma se persiste en la base de datos.

## 5. Restricciones y supuestos
- No se puede cambiar el ID de juegos MakeCode existentes.
- Los IDs de Scratch serán numéricos (ej. `617923907`) con prefijo `scratch_` para evitar colisiones con MakeCode.
- No hay API de thumbnails para Scratch → solo carga manual.
- Scratch embed requiere `allowtransparency` y no tiene sandbox restrictivo.
- La migración debe ser hacia atrás compatible (juegos MakeCode existentes se asignan `platform = 'makecode'`).

## 6. Dirección visual
- Toggle/segmented control en la parte superior del formulario para elegir plataforma.
- Cada plataforma tiene su propio color sutil de acento (MakeCode → arcade-red, Scratch → arcade-green o un tono naranja/amarillo).
- Preview embed con altura fija, buena separación entre secciones.
- Consistente con el sistema de diseño existente (shadcn/ui + arcade palette).
- Diseño limpio, sin ornamentación excesiva, buena jerarquía visual.

## 7. Skills y referencias a usar
- `frontend-design` — guía estética general.
- `tailwind-css-patterns` — patrones de layout responsive.
- No se requieren skills locales adicionales.

## 8. Arquitectura de implementación

### Base de datos (migración)
```sql
ALTER TABLE games ADD COLUMN platform text NOT NULL DEFAULT 'makecode';
ALTER TABLE games ADD CONSTRAINT games_platform_check CHECK (platform IN ('makecode', 'scratch'));
```

### Estructura de archivos

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/00003_add_platform.sql` | Crear |
| `lib/game-utils.ts` | Modificar — añadir funciones Scratch |
| `lib/definitions.ts` | Modificar — añadir `platform` a Game |
| `components/ScratchEmbed.tsx` | Crear — componente de embed Scratch |
| `components/SubmitGameForm.tsx` | Rediseñar — toggle + secciones |
| `components/EditGameForm.tsx` | Modificar — soporte Scratch |
| `components/GameTabs.tsx` | Modificar — render condicional |
| `lib/actions/games.ts` | Modificar — validación dual |
| `app/(protected)/subir/page.tsx` | Modificar — copy |
| `app/(public)/juego/[id]/page.tsx` | Modificar — pasar platform |

### Flujo de datos
1. Usuario selecciona plataforma (MakeCode / Scratch)
2. Ingresa URL → se extrae ID → se construye embed URL → se muestra preview
3. Thumbnail: MakeCode → auto + upload; Scratch → solo upload
4. Submit → `createGame` valida según plataforma → inserta con `platform` → redirect

## 9. Cambios por archivo

### `lib/game-utils.ts`
- Añadir `extractScratchId(url: string): string | null`
- Añadir `buildScratchEmbedUrl(id: string): string`
- Añadir `isValidScratchUrl(url: string): boolean`
- Añadir `extractGamePlatform(url: string): 'makecode' | 'scratch' | null`
- Exportar nuevas funciones

### `lib/definitions.ts`
- Añadir `platform: 'makecode' | 'scratch'` al interface `Game`

### `components/ScratchEmbed.tsx`
- Mismo patrón que `ArcadeEmbed` pero con:
  - Atributo `allowtransparency`
  - Aspect ratio personalizado (aspect-[485/402] o aproximado a 6:5)
  - Sin `sandbox` (no necesario para Scratch)
  - Mismos estados: loading, error, loaded

### `components/SubmitGameForm.tsx`
- Añadir estado `platform: 'makecode' | 'scratch'`
- Segmented control / radio group visual en la parte superior
- Cuando `platform === 'makecode'`: input URL MakeCode + preview ArcadeEmbed + ThumbnailPicker
- Cuando `platform === 'scratch'`: input URL Scratch + preview ScratchEmbed + upload thumbnail
- Los campos de título, descripción y categoría abajo, compartidos
- Submit: pasar `platform` al formData

### `components/EditGameForm.tsx`
- Recibir `platform` del game object
- Renderizar `ArcadeEmbed` o `ScratchEmbed` según platform
- Para Scratch, no mostrar ThumbnailPicker con auto-fetch

### `components/GameTabs.tsx`
- Recibir `platform` prop
- Si `platform === 'scratch'`: renderizar solo el embed (sin pestaña editor)
- Si `platform === 'makecode'`: comportamiento actual

### `lib/actions/games.ts`
- `createGame`: detectar plataforma de la URL, validar según tipo
- Si Scratch URL: usar `extractScratchId`, construir embed con `buildScratchEmbedUrl`
- Si MakeCode URL: validación existente
- Guardar `platform` en la DB

### `app/(protected)/subir/page.tsx`
- Actualizar descripción: "Publicá tu juego de MakeCode Arcade o Scratch"

### `app/(public)/juego/[id]/page.tsx`
- Pasar `platform` y `embed_url` a `GameTabs`

## 10. Componentes y contratos

### SubmitGameForm
```typescript
interface SubmitGameFormProps {
  categories: { id: string; name: string }[]
}
// Estado interno: platform, urlValue, thumbnailUrl, etc.
```

### ScratchEmbed
```typescript
interface ScratchEmbedProps {
  url: string
  title: string
}
// Similar a ArcadeEmbed pero con iframe con allowtransparency y aspect ratio 6:5
```

### GameTabs (modificado)
```typescript
interface GameTabsProps {
  gameId: string
  title: string
  platform: 'makecode' | 'scratch'
  embedUrl?: string  // para Scratch, usar embed_url directamente
}
```

## 11. Estados y comportamiento

### Platform toggle
- Default: `'makecode'` (retrocompatible)
- Al cambiar, se resetea el valor de URL y preview
- Transición suave entre secciones

### URL Input — MakeCode
- Placeholder: `https://arcade.makecode.com/---run?id=...`
- Hints: formatos aceptados (igual que ahora)
- Validación en cliente con `isValidMakeCodeUrl`
- Preview con `ArcadeEmbed`

### URL Input — Scratch
- Placeholder: `https://scratch.mit.edu/projects/617923907`
- Hint: "Pegá la URL de tu proyecto de Scratch"
- Validación: hostname === `scratch.mit.edu`, path starts with `/projects/`
- Preview con `ScratchEmbed`

### Thumbnail — MakeCode
- Auto-búsqueda de thumbnail oficial + opción de upload
- Igual que implementación actual

### Thumbnail — Scratch
- Solo upload manual
- No hay auto-búsqueda (Scratch no expone API pública de thumbnails)

### Submit button
- Label dinámico: "Publicar juego" / "Publicando..."
- Deshabilitado mientras pending

### Error states
- Errores de validación de URL (inline)
- Error de server (destructive alert box)

## 12. Responsive
- Single column en mobile (<640px)
- Platform toggle ocupa todo el ancho en mobile
- Preview embed se adapta al ancho del contenedor
- Mismo max-w-2xl que la página actual

## 13. Accesibilidad
- Platform toggle: botones con `role="radio"` o `aria-pressed`
- URL input: `aria-describedby` para hints, `aria-invalid` para errores
- Preview: `title` descriptivo en el iframe
- Skip link al formulario
- Mensajes de error con `role="alert"`
- Todos los íconos tienen `aria-hidden="true"` o texto alternativo

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Colisión de IDs entre MakeCode y Scratch | Prefijo `scratch_` para Scratch |
| Scratch cambia su formato de embed | El embed URL se guarda en DB, no se reconstruye desde cero siempre |
| Migración de datos existentes | Default `'makecode'` mantiene compatibilidad |
| Error al cargar embed de Scratch | Componente muestra estado de error gracefully |

## 15. Orden de ejecución

1. Migración DB: añadir columna `platform`
2. `lib/game-utils.ts`: añadir funciones Scratch
3. `lib/definitions.ts`: actualizar interface Game
4. `components/ScratchEmbed.tsx`: nuevo componente
5. `components/SubmitGameForm.tsx`: rediseño completo
6. `lib/actions/games.ts`: validación dual en createGame
7. `app/(protected)/subir/page.tsx`: actualizar copy
8. `components/GameTabs.tsx`: soporte plataforma
9. `app/(public)/juego/[id]/page.tsx`: pasar platform
10. `components/EditGameForm.tsx`: soporte Scratch
11. Validación en navegador con chrome-devtools

## 16. Validación en navegador
- [ ] Cargar formulario, verificar toggle visual
- [ ] Alternar entre MakeCode y Scratch, ver secciones cambian
- [ ] Ingresar URL MakeCode válida, ver preview
- [ ] Ingresar URL Scratch válida, ver preview
- [ ] Ingresar URL inválida, ver error inline
- [ ] Enviar formulario con datos MakeCode
- [ ] Enviar formulario con datos Scratch
- [ ] Ver página de detalle del juego Scratch
- [ ] Ver página de detalle del juego MakeCode (sin regresión)
- [ ] Verificar responsive en 375px, 768px, 1024px
- [ ] Verificar que el embed de Scratch carga correctamente
- [ ] Verificar que el embed de MakeCode carga correctamente

## 17. Criterios de aceptación
- [ ] El formulario tiene un toggle claro entre MakeCode Arcade y Scratch
- [ ] Las URLs de Scratch se validan y procesan correctamente
- [ ] El preview del embed funciona para ambas plataformas
- [ ] Los juegos de Scratch se renderizan correctamente en su página de detalle
- [ ] La edición de juegos Scratch funciona (EditGameForm)
- [ ] No hay regresiones en juegos MakeCode existentes
- [ ] La migración de DB es compatible hacia atrás
- [ ] El thumbnail de Scratch se puede subir manualmente
