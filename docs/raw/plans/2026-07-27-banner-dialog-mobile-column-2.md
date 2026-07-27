# Banner Dialog — Columna 2 invisible en móvil

## 1. Objetivo
Hacer visibles y usables en móvil los controles de la columna 2 del diálogo crear/editar slide en `/admin/banner`:
selector de plantillas, configuración de links, y duración (tiempo de desplazamiento).

## 2. Contexto actual
- Ruta: `app/(protected)/admin/banner/banner-admin-client.tsx`
- El diálogo (líneas 379-723) usa un layout de 2 columnas con `flex-col sm:flex-row`
- **Columna 1** (form): siempre visible, tiene los campos de imagen, título, subtítulo, CTA
- **Columna 2** (preview + config): oculta en móvil con `hidden`, solo visible en `sm:flex`

## 3. Problema
La columna 2 está marcada `hidden sm:flex sm:w-1/2 sm:flex-col`. En pantallas < 640px:
- No se ve el **selector de plantillas** (3 cards: bar-right, bar-left, full-image)
- No se ven los **checkboxes de link** (clickable, openInNewTab)
- No se ve el **input de duración** (2-30 segundos)
- El usuario en móvil no puede configurar template, links, ni tiempo de desplazamiento

## 4. Resultado esperado
En móvil, el diálogo muestra ambas columnas apiladas verticalmente y es scrolleable.
En desktop se mantiene el comportamiento actual (2 columnas lado a lado, columna 1 scrolleable).

## 5. Restricciones y supuestos
- Usar solo Tailwind, sin JS adicional
- No romper el layout desktop existente
- Mantener la preview visible en móvil (valor agregado)
- El diálogo usa `fixed inset-0` con overlay `bg-black/50`

## 6. Dirección visual
Sin cambios visuales. Solo ajustes de layout responsive.

## 7. Skills y referencias a usar
- tailwind-css-patterns (mobile-first responsive)
- frontend-design

## 8. Arquitectura de implementación
Tres cambios puntuales en `banner-admin-client.tsx`:

### Cambio 1 — Diálogo interno (línea ~381)
Agregar scroll vertical en móvil y max-height:
- `overflow-hidden` → `overflow-y-auto sm:overflow-hidden`
- Agregar `max-h-[90vh] sm:max-h-none`

### Cambio 2 — Columna 1 (línea ~383)
Quitar restricción de altura fija en móvil:
- `max-h-[90vh]` → `sm:max-h-[90vh]`

### Cambio 3 — Columna 2 (línea ~542)
Hacer visible en móvil con borde superior como separador:
- `hidden border-l bg-muted/30 sm:flex sm:w-1/2 sm:flex-col`
- → `flex flex-col border-t border-border bg-muted/30 sm:border-l sm:border-t-0 sm:w-1/2`

## 9. Cambios por archivo
| Archivo | Cambio |
|---------|--------|
| `banner-admin-client.tsx` | 3 ediciones (diálogo, col1, col2) |

## 10. Componentes y contratos
Sin cambios en props, tipos ni estructura de componentes.

## 11. Estados y comportamiento
- Móvil (< 640px): diálogo scrolleable, 2 columnas apiladas
- Desktop (≥ 640px): layout side-by-side sin cambios
- Loading/Saving: igual que antes
- Dialog open/close: igual que antes

## 12. Responsive
- Móvil 375px+: diálogo ocupa hasta 90vh con scroll, ambas columnas visibles
- Tablet/Desktop 640px+: comportamiento original sin cambios

## 13. Accesibilidad
- Sin cambios. El diálogo ya es un `form` accesible.

## 14. Riesgos y mitigaciones
- **Riesgo:** El diálogo en móvil puede ser muy largo si hay muchos campos. **Mitigación:** `max-h-[90vh]` limita la altura, y el scroll permite navegar todo el contenido.
- **Riesgo:** `overflow-y-auto` + `rounded-xl` podría cortar el scrollbar. **Mitigación:** Esto es comportamiento estándar de CSS; el border-radius se aplica al border-box.

## 15. Orden de ejecución
1. Editar línea ~381 (diálogo interno)
2. Editar línea ~383 (columna 1)
3. Editar línea ~542 (columna 2)
4. Validar en chrome-devtools

## 16. Validación en navegador
- [ ] Mobile 375px: diálogo scrolleable, columna 2 visible con template/duration/link
- [ ] Mobile 375px: crear slide y verificar que template, link y duration se guardan
- [ ] Desktop 1280px: layout side-by-side intacto
- [ ] Desktop: columna 1 scroll independiente funciona
- [ ] Sin overflow horizontal en ninguna resolución

## 17. Criterios de aceptación
- En móvil, el selector de plantillas es visible y se puede cambiar
- En móvil, los checkboxes de link son visibles y funcionales
- En móvil, el input de duración es visible y funcional
- El diálogo hace scroll en móvil si el contenido excede la pantalla
- El layout desktop no tiene regresiones
