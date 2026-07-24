# Plan: Rediseño del Header + Buscador Multi-entidad

**Fecha:** 2026-07-23
**Estado:** Aprobado

## Objetivos

1. Rediseñar el header para homogeneizar iconos y ordenarlos mejor
2. Mostrar avatar del usuario logueado (sin username visible)
3. Hacer funcionar el buscador para buscar juegos, usuarios y categorías

## Cambios

### 1. Navbar.tsx (server component)
- Agregar `avatar_url` al select del perfil
- Pasar `avatarUrl` a `NavbarClient`

### 2. NavbarClient.tsx (client component)
- **Search input**: reemplazar icono Search por un `<Input>` con lupa que navega a `/buscar?q=...` al presionar Enter
- **Grupo usuario**: avatar + dropdown unificado que reemplaza: User icon, Settings icon, Moderar texto, Admin texto, Cerrar sesión texto
- **Iconos homogéneos**: todos los botones del header usan `variant="ghost" size="icon"` con `text-arcade-beige` y hover `bg-arcade-red/80`
- **Mobile**: input de búsqueda + menú hamburguesa actualizado

### 3. Nueva server action `lib/actions/search.ts`
- `searchAll(query)` → `{ games: GameWithDetails[], users: Profile[], tags: Tag[] }`
- 3 queries en paralelo con ILIKE
- Juegos: title (status=approved, hidden=false, limit 8)
- Usuarios: username (limit 8)
- Tags: name (limit 8)

### 4. Nueva ruta `app/(public)/buscar/page.tsx`
- Página de resultados con 3 secciones grid: Juegos, Usuarios, Categorías
- Cada sección con top N resultados y "Ver más"

### 5. Archivos afectados
| Archivo | Acción |
|---------|--------|
| `components/Navbar.tsx` | Modificar |
| `components/NavbarClient.tsx` | Reescribir |
| `lib/actions/search.ts` | Crear |
| `app/(public)/buscar/page.tsx` | Crear |
| `docs/wiki/frontend/components.md` | Actualizar |
| `docs/wiki/architecture/routes.md` | Actualizar |

### No cambia
- `SearchBar.tsx` (homepage) se mantiene
- `getGames` no se modifica
- `LoadMoreGames` no se modifica
