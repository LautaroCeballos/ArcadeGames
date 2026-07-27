# Unificar Favoritos en los filtros del perfil

## 1. Objetivo
Mover la sección "Favoritos" del perfil desde una pestaña independiente a un filtro dentro de la tab "Juegos", unificándolo con los filtros existentes "Todos los Juegos", "Publicados", "En moderación", "Rechazados" y "Borradores".

## 2. Contexto actual
- `components/ProfileTabs.tsx` tiene 3 pestañas superiores: **Juegos**, **Favoritos** (solo dueño, si tiene favoritos) y **Logros** (solo si tiene badges).
- Dentro de "Juegos", cuando `isOwner=true`, se muestran sub-filtros: Todos, Publicados, En moderación, Rechazados, Borradores.
- "Favoritos" es una pestaña separada que renderiza `favoritedGames` con `ProfileGameCard` en modo vista (sin acciones de edición).
- El fetch de `favoritedGames` ya se hace en la página del perfil (`page.tsx`) y se pasa como prop a `ProfileTabs`.

## 3. Problema
"Favoritos" está aislado como una pestaña separada, lo que obliga al usuario a cambiar de pestaña para ver sus juegos favoritos. Es más coherente tenerlo como un filtro más dentro de "Juegos", junto a "Todos", "Publicados", etc.

## 4. Resultado esperado
- Los favoritos aparecen como un botón de filtro en la misma barra que "Todos los Juegos", "Publicados", etc.
- Al seleccionar "Favoritos", se muestran los juegos favoritos del usuario (en modo vista, sin acciones de edición).
- Se elimina la pestaña superior "Favoritos".
- "Logros" sigue siendo una pestaña separada (toggle, igual que ahora).
- El comportamiento para no-dueños no cambia.

## 5. Restricciones y supuestos
- Solo el dueño del perfil ve los sub-filtros (incluyendo Favoritos).
- Solo se muestra el filtro "Favoritos" si el usuario tiene al menos 1 juego favorito (misma lógica que antes).
- Los juegos favoritos se muestran en modo vista (`isOwner={false}`) porque no son juegos del usuario.
- `favoritedGames` ya está disponible como prop; no hay que modificar `page.tsx`.

## 6. Dirección visual
- El botón "Favoritos" debe tener el mismo estilo que los otros sub-filtros (misma fuente, padding, colores).
- El icono de corazón (opcional) puede acompañar al texto para distinguirlo visualmente.
- Los contadores deben ser consistentes: `Favoritos (N)`.

## 7. Skills y referencias a usar
- Ninguna skill adicional necesaria para este cambio.

## 8. Arquitectura de implementación
Cambio localizado en `components/ProfileTabs.tsx`:
1. Agregar `"favoritos"` al type `GameFilter`
2. Agregar entrada en `gameFilterLabels`
3. Agregar conteo en `gamesByStatus` (usando `favoritedGames.length`)
4. Agregar botón de filtro en la barra de sub-filtros (solo si `isOwner` y hay favoritos)
5. En el render de juegos, cuando `gameFilter === "favoritos"`, mostrar `favoritedGames` con `isOwner={false}`
6. Eliminar la pestaña superior "Favoritos" y su sección de renderizado
7. Ajustar mensajes de empty state

## 9. Cambios por archivo

### `components/ProfileTabs.tsx`
- **Type `GameFilter`**: agregar `"favoritos"`
- **`gameFilterLabels`**: agregar `favoritos: "Favoritos"`
- **`gamesByStatus`**: agregar `favoritos: favoritedGames?.length ?? 0`
- **Barra de sub-filtros** (línea ~74): agregar botón para "Favoritos" condicional (solo si `isOwner` y `favoritedGames?.length > 0`)
- **Sección de renderizado** (línea ~90): cuando `gameFilter === "favoritos"`, renderizar `favoritedGames`; de lo contrario renderizar `filteredGames`
- **Eliminar** la pestaña superior "Favoritos" (el `TabButton` con `activeTab === "favoritos"`)
- **Eliminar** la sección `activeTab === "favoritos"` del render condicional
- Eliminar `"favoritos"` del type `Tab` (ya no es una pestaña superior)

## 10. Componentes y contratos
Solo se modifica `ProfileTabs.tsx`. La interfaz `ProfileTabsProps` no cambia. `ProfileGameCard` no cambia.

## 11. Estados y comportamiento

| Estado | Filtro activo | Comportamiento |
|--------|--------------|----------------|
| Dueño con favoritos + selecciona "Favoritos" | `favoritos` | Muestra `favoritedGames` con `isOwner={false}` |
| Dueño sin favoritos | No aparece el botón "Favoritos" | — |
| Dueño con favoritos pero selecciona otro filtro | `all/approved/pending/rejected/draft` | Muestra `filteredGames` con `isOwner={true}` |
| No dueño | Sin cambios | Solo ve "Juegos" (sin sub-filtros) |

## 12. Responsive
Sin cambios. Los sub-filtros ya son responsive (flex-wrap implícito). El botón adicional "Favoritos" no altera el layout.

## 13. Accesibilidad
Sin cambios significativos. Los botones de filtro mantienen el mismo rol y comportamiento de foco.

## 14. Riesgos y mitigaciones
- **Riesgo**: Que `favoritedGames` sea `undefined` si no se pasa la prop. **Mitigación**: Usar optional chaining `favoritedGames?.length` y fallback a `[]`.
- **Riesgo**: Romper empty state. **Mitigación**: Probar que el mensaje para "Favoritos" sea correcto: "Aún no tienes juegos favoritos".

## 15. Orden de ejecución
1. Modificar `components/ProfileTabs.tsx` con todos los cambios descritos
2. Verificar que la página del perfil compile y renderice correctamente

## 16. Validación en navegador
- Abrir perfil propio con juegos favoritos → ver "Favoritos (N)" en la barra de sub-filtros
- Clic en "Favoritos" → ver los juegos favoritos sin acciones de edición
- Volver a "Todos" → ver todos los juegos del usuario
- Verificar que la pestaña "Favoritos" superior ya no existe
- Verificar que "Logros" sigue funcionando
- Abrir perfil propio sin favoritos → no aparece "Favoritos" en sub-filtros
- Abrir perfil ajeno → no hay sub-filtros (sin cambios)

## 17. Criterios de aceptación
- [ ] "Favoritos" aparece como filtro en la misma barra que "Todos", "Publicados", etc. (solo dueño, solo si tiene favoritos)
- [ ] Al seleccionar "Favoritos" se muestran los juegos favoritos en modo vista
- [ ] No existe más la pestaña superior "Favoritos"
- [ ] "Logros" sigue funcionando como antes
- [ ] Perfiles ajenos no tienen cambios visuales
