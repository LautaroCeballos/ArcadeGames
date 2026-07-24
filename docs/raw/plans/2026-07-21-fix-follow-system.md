# Plan: Reparar sistema de Follow (contadores + botón)

## 1. Objetivo
Reparar los contadores de seguidores/siguiendo en el perfil y el toggle del botón "Seguir"/"Siguiendo" que no se actualizan después de seguir o dejar de seguir a un usuario.

## 2. Contexto actual
- `lib/actions/social.ts` — Server Actions `followUser`, `unfollowUser`, `isFollowing`, `getFollowers`, `getFollowing`. Usan `revalidatePath` para invalidar cache.
- `components/FollowButton.tsx` — Componente cliente que envuelve server actions en un handler manual y llama a `router.refresh()`.
- `components/ProfileHeader.tsx` — Renderiza stats (followers_count, following_count) y el FollowButton.
- `app/(public)/perfil/[username]/page.tsx` — Server component que llama a `getProfileByUsername` y `isFollowing`.
- `lib/actions/profile.ts` — `getProfileByUsername` computa los contadores.

## 3. Problema
El botón "Seguir"/"Siguiendo" no cambia de estado visual después de hacer clic, y los contadores de seguidores/siguiendo no se actualizan.

### Causas raíz identificadas
1. **`refresh()` no se llama desde los Server Actions**: En Next.js 16, cuando un Server Action se invoca desde un handler cliente (no directo al form), se necesita `refresh()` de `next/cache` para que el cliente refresque la UI.
2. **FollowButton usa wrapper cliente en vez de Server Action directo**: `action={handleSubmit}` envuelve la llamada en una transición de React 19, lo que puede interferir con `router.refresh()`.
3. **Falta revalidación cruzada**: Las páginas `/perfil/[username]/seguidores` y `/perfil/[username]/siguiendo` no se revalidan tras una mutación.

## 4. Resultado esperado
- Al hacer clic en "Seguir" → el botón cambia a "Siguiendo" inmediatamente y el contador de seguidores aumenta.
- Al hacer clic en "Siguiendo" → el botón cambia a "Seguir" y el contador disminuye.
- En las páginas de lista (`/seguidores`, `/siguiendo`) los botones también reflejan el estado correcto.

## 5. Restricciones y supuestos
- El proyecto usa Next.js 16.2.10 (con soporte para `refresh()` de `next/cache`).
- La DB ya funciona correctamente (inserts/deletes en `follows`).
- Las RLS policies están correctas.
- `cacheComponents` no está habilitado (modelo de caché anterior).

## 6. Dirección visual
Sin cambios visuales. Solo corrección de lógica.

## 7. Skills y referencias
- `next-best-practices` — Server Actions, revalidación
- `wiki` — Para documentar la feature

## 8. Arquitectura de implementación
```
FollowButton (cliente)
  → usa useActionState con followUser.bind(null, targetUserId) o unfollowUser.bind(null, targetUserId)
  → Next.js maneja el refresco automáticamente (single roundtrip)
  
Server Action (social.ts)
  → revalidatePath para perfil + listas
  → refresh() de next/cache como respaldo

ProfilePage (server)
  → getProfileByUsername() → contadores actualizados
  → isFollowing() → estado actualizado
```

## 9. Cambios por archivo

### `lib/actions/social.ts`
- Agregar `refresh` a import de `next/cache`
- En `revalidateProfilePage`: agregar revalidatePath para `/perfil/${targetUsername}/seguidores` y `/perfil/${targetUsername}/siguiendo`
- En `followUser`: agregar `refresh()` después de `revalidateProfilePage()`
- En `unfollowUser`: agregar `refresh()` después de `revalidateProfilePage()`

### `components/FollowButton.tsx`
- Eliminar `useState` para pending (lo maneja useActionState)
- Eliminar `useRouter` y `router.refresh()`
- Importar `useActionState` de React
- Separar followUser y unfollowUser en dos server actions bindeadas
- O usar acción única que detecte estado actual
- Usar `useActionState` para manejar estado del server action

### `components/FollowList.tsx`
- No requiere cambios (solo pasa props a FollowButton)

### `docs/wiki/features/social.md` (nuevo)
- Documentar sistema de follows

## 10. Componentes y contratos

### FollowButton (refactorizado)
```tsx
interface FollowButtonProps {
  targetUserId: string
  isFollowing: boolean
}

// Usa:
// followUser.bind(null, targetUserId) - server action
// unfollowUser.bind(null, targetUserId) - server action
// useActionState para manejar estado
```

### ProfileHeader
```tsx
interface ProfileHeaderProps {
  profile: ProfileWithStats
  isOwnProfile: boolean
  isFollowing: boolean
}
```
Sin cambios en la interfaz.

### Server Actions
```typescript
followUser(targetUserId: string): Promise<{ error: string } | { success: true }>
unfollowUser(targetUserId: string): Promise<{ error: string } | { success: true }>
isFollowing(targetUserId: string): Promise<boolean>
```
Sin cambios en firmas.

## 11. Estados y comportamiento
- **Loading**: Botón deshabilitado con spinner (useActionState pending)
- **Error**: Mensaje de error debajo del botón
- **Success**: Botón cambia de "Seguir" a "Siguiendo" y viceversa, contadores se actualizan
- **Disabled**: Botón deshabilitado mientras la acción está en progreso

## 12. Responsive
Sin cambios. El botón ya es responsive.

## 13. Accesibilidad
- El botón usa `<button>` nativo con texto descriptivo
- Los estados se comunican visualmente (texto del botón + spinner)

## 14. Riesgos y mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| `useActionState` no refresca la UI automáticamente | Agregar `refresh()` de respaldo en server action |
| Error silencioso en server action | El error se captura y muestra en el state |
| Ruta revalidatePath incorrecta | Verificar que coincide con la URL real (`/perfil/{username}`) |

## 15. Orden de ejecución
1. Actualizar `lib/actions/social.ts` — import + revalidatePaths + refresh()
2. Refactorizar `components/FollowButton.tsx` — useActionState
3. Verificar en navegador que funciona
4. Crear wiki docs

## 16. Validación en navegador
1. Navegar a perfil de otro usuario
2. Click "Seguir" → debe cambiar a "Siguiendo", contador +1
3. Recargar página → debe mantener estado
4. Click "Siguiendo" → debe cambiar a "Seguir", contador -1
5. Ir a `/perfil/[username]/seguidores` → botones deben funcionar
6. En mobile (375px) debe funcionar igual
7. Verificar en Chrome DevTools que no hay errores de consola

## 17. Criterios de aceptación
- [ ] El botón "Seguir"/"Siguiendo" cambia de estado sin recargar la página
- [ ] Los contadores de seguidores y siguiendo se actualizan
- [ ] Funciona en página de perfil, seguidores y siguiendo
- [ ] No hay errores en consola
- [ ] El estado persiste al recargar la página
