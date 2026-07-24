# Live search dropdown con debounce

## 1. Objetivo
Convertir el buscador del header en tiempo real: al escribir, tras 500ms de debounce, buscar automáticamente y mostrar resultados en un dropdown debajo del input.

## 2. Contexto actual
- El header tiene un input de búsqueda que solo navega a `/buscar?q=...` al presionar Enter
- No hay feedback visual de resultados mientras se escribe
- Ya existe `lib/actions/search.ts` con la server action `searchAll` que busca en games, profiles y tags con ILIKE

## 3. Problema
El usuario necesita presionar Enter y cambiar de página para ver resultados. Quiere ver resultados instantáneos mientras escribe.

## 4. Resultado esperado
- Mientras el usuario escribe, tras 500ms de inactividad, aparece un dropdown con resultados agrupados (Juegos, Usuarios, Categorías)
- Loading state mientras se ejecuta la búsqueda
- Click en un resultado navega directamente
- Footer "Ver todos los resultados" navega a `/buscar?q=...`
- Escape o click fuera cierra el dropdown
- Enter en el input sigue navegando a la página completa

## 5. Restricciones y supuestos
- Solo desktop: mobile conserva el comportamiento actual (Enter → navegar)
- La server action `searchAll` ya existe y funciona
- No se requieren cambios en el backend ni en la DB
- El dropdown debe ser visualmente coherente con el diseño actual (oscuro, beige, bordes redondeados)

## 6. Dirección visual
- Dropdown con fondo `bg-arcade-dark`, bordes `border-arcade-beige/10`, sombra `shadow-xl shadow-black/40`
- Secciones separadas por líneas divisorias tenues
- Games: thumbnail 32×32 + título + "por username"
- Users: avatar 28×28 + username + bio opcional
- Tags: pills con border
- Footer: botón "Ver todos los resultados" con icono de Search
- Loading: spinner Loader2

## 7. Skills y referencias a usar
- `vercel-react-best-practices`: para el patrón de debounce con cancelación de race conditions
- `typescript-advanced-types`: para tipar correctamente `Awaited<ReturnType<typeof searchAll>>`

## 8. Arquitectura de implementación
- Solo se modifica `components/NavbarClient.tsx`
- No se toca el backend ni otros componentes
- Se importa `searchAll` directamente (server action → el framework maneja el fetch)
- Se usa `useEffect` con `setTimeout`/`clearTimeout` para debounce
- Flag `cancelled` para evitar race conditions de respuestas fuera de orden

## 9. Cambios por archivo
- `components/NavbarClient.tsx`:
  - Importar `Loader2` de lucide-react
  - Importar `searchAll` de lib/actions/search
  - Agregar estado: `searchResults`, `searchLoading`, `searchOpen`
  - Agregar `searchContainerRef`
  - Agregar useEffect debounce (500ms) con flag `cancelled`
  - Agregar useEffect Escape key
  - Extender click-outside handler para incluir search
  - Envolver form de búsqueda en div container
  - Renderizar dropdown condicional con loading, empty, results y footer

## 10. Componentes y contratos
- `NavbarClient` se mantiene igual (props no cambian)
- `searchAll` server action se importa directamente (Next.js 16 maneja la serialización)
- Tipo del estado: `Awaited<ReturnType<typeof searchAll>>`

## 11. Estados y comportamiento
| Estado | Visual |
|--------|--------|
| Input vacío | Sin dropdown |
| Escribiendo | Timer de 500ms, sin feedback visual |
| Loading | Spinner + "Buscando…" en el dropdown |
| Resultados | Secciones con juegos, usuarios, tags |
| Sin resultados | "No se encontraron resultados para X" |
| Error silencioso | Dropdown se cierra (catch sin feedback) |
| Click fuera | Se cierra el dropdown |
| Escape | Se cierra el dropdown |
| Enter | Navega a `/buscar?q=...` |
| Click en resultado | Navega + cierra dropdown |
| Focus en input | Reabre dropdown si hay resultados previos |
| Navegación (pathname change) | Se cierra el dropdown |

## 12. Responsive
- Desktop: dropdown absoluto debajo del input
- Mobile: sin cambios (sigue navegando con Enter)

## 13. Accesibilidad
- Dropdown navegable con click (no se requiere teclado para resultados individuales)
- Escape cierra el dropdown
- `sr-only` no necesario (es un dropdown de resultados visuales)

## 14. Riesgos y mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Race condition (respuesta lenta sobrescribe respuesta rápida) | Flag `cancelled` en el cleanup del useEffect |
| Muchas requests al servidor | Debounce de 500ms |
| Server action no importable desde client component | Next.js 16 soporta `"use server"` importable desde client components |
| Dropdown muy grande | Max 6 juegos + 5 usuarios en dropdown |

## 15. Orden de ejecución
1. Agregar imports
2. Agregar estados + ref
3. Agregar debounce effect + escape effect
4. Extender click-outside handler
5. Modificar template del search input
6. Agregar dropdown render
7. Build y validación

## 16. Validación en navegador
- [ ] Escribir "a" → esperar 500ms → ver dropdown con resultados
- [ ] Escribir rápido "abc" → solo una búsqueda a los 500ms del último carácter
- [ ] Click fuera del dropdown → se cierra
- [ ] Escape → se cierra
- [ ] Click en un juego → navega a `/juego/{id}`
- [ ] Click en un usuario → navega a `/perfil/{username}`
- [ ] Click en un tag → navega a `/?tag={id}`
- [ ] Click en "Ver todos los resultados" → navega a `/buscar?q=...`
- [ ] Presionar Enter → navega a `/buscar?q=...`
- [ ] Borrar texto → dropdown se cierra
- [ ] Focus en input con resultados previos → dropdown se reabre

## 17. Criterios de aceptación
- [ ] Build compila sin errores
- [ ] El dropdown aparece tras 500ms de inactividad al escribir
- [ ] Los resultados se muestran agrupados por tipo
- [ ] Navegar a cualquier resultado desde el dropdown funciona
- [ ] El dropdown se cierra correctamente en todos los casos
- [ ] No hay race conditions (resultados viejos no sobrescriben nuevos)
