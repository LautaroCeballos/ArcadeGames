# Normalizar tags: de UUID a slug en /buscar + pulir homepage

## 1. Objetivo
- Reemplazar UUIDs de tags en URLs por nombres normalizados (slugs)
- Mover la navegación por tags a la ruta `/buscar`
- Eliminar el filtro de tags (TagFilter) de "Todos los juegos" en la homepage
- Agregar botón "Ver Más" en "Todos los juegos" al estilo de las secciones "Novedades" y "Juegos destacados"

## 2. Contexto actual
- Los tags se linkean con `/?tag=${tag.id}` (UUID tipo `ddcddd9a-6bda-48c5-8669-53e0b7c81d95`)
- `CategoryExplorer.tsx` y `TagCard` (en buscar) usan UUIDs en los href
- `TagFilter` (CategoryFilter.tsx) usa UUIDs para filtrar en la URL
- "Todos los juegos" en `page.tsx` tiene TagFilter, paginación, sort y search
- `/buscar/page.tsx` tiene modo Browse con TagFilter y modo Search

## 3. Problema
- URLs con UUIDs son ilegibles y no compartibles
- El filtro de tags en la homepage ocupa espacio y distrae del contenido principal
- "Todos los juegos" no sigue el patrón de preview + "Ver Más" de las otras secciones

## 4. Resultado esperado
- Tags linkean a `/buscar?tag=accion` (slug legible)
- TagFilter en `/buscar` usa slugs en la URL
- "Todos los juegos" en homepage es un preview de 8 juegos con "Ver Más" → `/buscar`
- Sin TagFilter en homepage

## 5. Restricciones y supuestos
- Los nombres de tags son fijos (seed data) y en español con acentos
- Solo ~20 tags, resolución por slug es barata
- `getGameList` sigue aceptando `tagIds: string[]` (UUIDs internamente)
- La ruta `/buscar` existe y funciona con modo Browse

## 6. Dirección visual
- "Ver Más" en "Todos los juegos" usa el mismo estilo que "Novedades" y "Juegos destacados": link con flecha `→`
- Sin cambios visuales mayores, solo reorganización

## 7. Skills y referencias a usar
- `frontend-design` para consistencia visual
- `tailwind-css-patterns` para estilos

## 8. Arquitectura de implementación

### Nuevo archivo: `lib/tag-utils.ts`
- `slugifyTagName(name: string): string` — normaliza nombre a slug URL-friendly

### Modificaciones:
1. `lib/queries/games.ts` → agregar `resolveTagSlug(slug: string): Promise<string | null>`
2. `components/CategoryExplorer.tsx` → cambiar href a `/buscar?tag=slug`
3. `components/CategoryFilter.tsx` → usar slugs en URL params
4. `app/(public)/buscar/page.tsx` → resolver slug a ID en BrowseGameList, TagCard usa slug
5. `app/(public)/page.tsx` → eliminar TagFilterWrapper, simplificar GameListSection, agregar "Ver Más"

## 9. Cambios por archivo

| Archivo | Cambio |
|---|---|
| `lib/tag-utils.ts` (nuevo) | Función `slugifyTagName` |
| `lib/queries/games.ts` | Nueva función `resolveTagSlug` |
| `components/CategoryExplorer.tsx` | Link href usa slug en vez de UUID |
| `components/CategoryFilter.tsx` | Compara/ setea slugs en URL |
| `app/(public)/buscar/page.tsx` | BrowseGameList resuelve slug; TagCard usa slug |
| `app/(public)/page.tsx` | Elimina TagFilterWrapper; GameListSection preview + Ver Más |

## 10. Componentes y contratos

### `CategoryExplorer`
- Entrada: `tags: Tag[]` (sin cambios)
- Salida: Links a `/buscar?tag=<slug>` en vez de `/?tag=<uuid>`

### `CategoryFilter`
- Entrada: `tags: Tag[]` (sin cambios)
- Comportamiento: `searchParams.get("tag")` ahora es un slug, se compara con `slugifyTagName(tag.name)`
- Al hacer click: setea `slugifyTagName(tag.name)` como valor del parámetro `tag`

### `BrowseGameList` (buscar/page.tsx)
- Entrada: `tag?: string` (ahora es slug, antes era UUID)
- Internamente: llama a `resolveTagSlug(tag)` para obtener UUID y pasar a `getGameList`

### `GameListSection` (page.tsx)
- Simplificado: muestra hasta 8 juegos, sin paginación
- Header incluye link "Ver Más" → `/buscar`

## 11. Estados y comportamiento

### TagFilter en `/buscar`
- Estado vacío: cuando searchParams.tag es un slug que no matchea ningún tag, tratar como sin filtro
- Estado activo: el tag cuyo slug coincide con el parámetro aparece como activo

### "Todos los juegos" preview
- Si no hay juegos: mostrar mensaje "No hay juegos aún"
- Con juegos: grid de hasta 8, con "Ver Más" al lado del título

## 12. Responsive
- El grid de "Todos los juegos" ya es responsive (grid-cols-2 sm:grid-cols-3 md:grid-cols-4)
- "Ver Más" se alinea a la derecha en desktop, abajo del título en mobile

## 13. Accesibilidad
- Links son navegables por teclado
- Slugs en URLs no afectan accesibilidad
- TagFilter mantiene roles de botón actuales

## 14. Riesgos y mitigaciones
- **Riesgo**: slug de tag name no encuentre match → Mitigación: `resolveTagSlug` retorna null y se ignora el filtro
- **Riesgo**: dos tags con mismo slug (ej. acentos) → Mitigación: los names son únicos en BD, slugify es determinista
- **Riesgo**: paginación rota en homepage → Mitigación: se elimina paginación, se usa preview simple

## 15. Orden de ejecución
1. Crear `lib/tag-utils.ts`
2. Agregar `resolveTagSlug` en `lib/queries/games.ts`
3. Actualizar `CategoryExplorer.tsx`
4. Actualizar `CategoryFilter.tsx`
5. Actualizar `buscar/page.tsx`
6. Actualizar `page.tsx` (homepage)
7. Build y verificar
8. Validar en navegador

## 16. Validación en navegador
- [ ] Click en tag "Acción" → navega a `/buscar?tag=accion`
- [ ] La página `/buscar?tag=accion` filtra juegos correctamente
- [ ] TagFilter en `/buscar` muestra "Acción" como activo
- [ ] Click en otro tag en TagFilter cambia la URL correctamente
- [ ] "Todos los juegos" en homepage no muestra TagFilter
- [ ] "Todos los juegos" tiene botón "Ver Más" que linkea a `/buscar`
- [ ] "Ver Más" se ve consistente con "Novedades" y "Juegos destacados"
- [ ] Modo search en `/buscar?q=...` sigue funcionando

## 17. Criterios de aceptación
- Ninguna URL contiene UUIDs de tags
- Click en tag desde CategoryExplorer va a `/buscar?tag=<slug>` con filtro activo
- TagFilter en `/buscar` funciona con slugs
- Homepage "Todos los juegos" sin TagFilter
- Homepage "Todos los juegos" tiene "Ver Más"
- Build sin errores
