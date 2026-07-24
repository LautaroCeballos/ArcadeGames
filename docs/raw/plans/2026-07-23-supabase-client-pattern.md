---
title: "ArcadePlay — Patrón de cliente Supabase"
tags: [architecture, database, refactor]
last_updated: "2026-07-23"
sources:
  - lib/supabase/server.ts
  - lib/supabase/client.ts
  - lib/supabase/middleware.ts
  - lib/actions/social.ts
  - lib/actions/games.ts
  - lib/actions/profile.ts
  - lib/actions/auth.ts
  - lib/actions/badges.ts
  - lib/actions/ranking.ts
  - lib/actions/ratings.ts
  - lib/actions/thumbnails.ts
  - app/(public)/perfil/[username]/page.tsx
  - app/(public)/page.tsx
  - app/(public)/signup/page.tsx
  - app/(public)/juego/[id]/page.tsx
  - app/(public)/perfil/[username]/seguidores/page.tsx
  - app/(public)/perfil/[username]/siguiendo/page.tsx
  - app/(protected)/cuenta/page.tsx
  - app/(protected)/editar/[id]/page.tsx
  - app/(protected)/moderar/page.tsx
  - app/(protected)/admin/usuarios/page.tsx
  - app/(protected)/subir/page.tsx
  - app/(protected)/dashboard/page.tsx
  - components/Navbar.tsx
---

# ArcadePlay — Patrón de cliente Supabase

## Problema

Cada vez que una Server Action o Server Component necesita acceder a Supabase, llama a `createClient()` (`lib/supabase/server.ts:4`). Esto crea una nueva instancia de `createServerClient` con su propio objeto de cookies. El resultado: **58 llamadas a `createClient()` en 21 archivos**, muchas de ellas redundantes dentro de una misma request.

## Auditoría completa (2026-07-23)

### Definiciones

| Archivo | Rol | Llamadas totales |
|---------|-----|-----------------|
| `lib/supabase/server.ts` | Define `createClient()` servidor | 1 (definición) |
| `lib/supabase/client.ts` | Define `createClient()` browser | 1 (definición, **nunca se importa**) |
| `lib/supabase/middleware.ts` | Helper de middleware (usa `createServerClient` directo) | 1 (correcto) |

### Pages (Server Components) — 12 archivos, 13 llamadas

| Archivo | Llamadas | Redundante? | Observación |
|---------|----------|-------------|-------------|
| `perfil/[username]/page.tsx` | 2 | **SÍ** | `generateMetadata` (L18) + `ProfilePage` (L38) crean 2 instancias para la misma URL |
| `perfil/[username]/seguidores/page.tsx` | 1 | No | Una sola instancia, mezcla auth + datos |
| `perfil/[username]/siguiendo/page.tsx` | 1 | No | Una sola instancia, mezcla auth + datos |
| Resto de pages (9 archivos) | 1 c/u | No | Cada una crea una sola instancia |

### Server Actions — 8 archivos, 42 llamadas

| Archivo | Llamadas | Redundantes? | Detalle |
|---------|----------|--------------|---------|
| `social.ts` | 6 | **SÍ** (4 redundantes) | `followUser`/`unfollowUser` crean cliente + llaman a `revalidateProfilePage` que crea otro → **2 por operación** |
| `games.ts` | 22 | **SÍ** (9 redundantes) | `getUserRole` (helper de `assertModerator`/`assertAdmin`) crea cliente + la función llamante crea otro → **2 por moderación** |
| `profile.ts` | 5 | No | Cada función exportada tiene su propio cliente |
| `auth.ts` | 4 | No | Igual |
| `badges.ts` | 2 | No | Igual |
| `ranking.ts` | 1 | No | Igual |
| `ratings.ts` | 1 | No | Igual |
| `thumbnails.ts` | 1 | No | Igual |

### Componentes — 1 archivo, 1 llamada

| Archivo | Llamadas | Observación |
|---------|----------|-------------|
| `components/Navbar.tsx` | 1 | Server Component, crea su propio cliente |

## Diagnóstico

### Problema 1: Instancias redundantes intra-request (severidad: media)

Causado por helpers que crean su propio cliente en vez de recibirlo:

```
followUser() → createClient()  ──┐
  └→ revalidateProfilePage() → createClient()  ──┘ 2 instancias distintas
```

```
assertModerator() → getUserRole() → createClient()  ──┐
approveGame() → createClient()  ────────────────────────┘ 2 instancias distintas
```

### Problema 2: Layout duplica instancia (severidad: baja)

`Navbar.tsx` crea un cliente. Cada page también crea el suyo. Ambas en la misma request → 2 instancias. Pero `Navbar` no puede compartir su cliente porque es un componente independiente.

### Problema 3: `lib/supabase/client.ts` nunca se usa (severidad: baja)

`createBrowserClient` ya es singleton por defecto (`isSingleton: true` es el default en browser). Pero nadie lo importa. El archivo es dead code.

### No es un problema

- `createBrowserClient` ya usa singleton internamente (`isSingleton: true` por defecto) — cada llamada devuelve la misma instancia. No necesita wrapper.
- `middleware.ts` hace lo correcto: usa `createServerClient` directo con `NextRequest`.
- Las Server Actions no pueden compartir cliente entre sí porque son requests independientes.

## Solución

### Principio rector

> **Server**: `React.cache()` para deduplicar `createClient()` dentro de la misma request. Cada request recibe un cliente fresco, pero no se crean instancias redundantes.
>
> **Browser**: Eliminar dead code. El singleton ya lo maneja `createBrowserClient` internamente.
>
> **Server Actions y helpers**: NO pasar cliente como argumento — `React.cache()` es suficiente.

### Fase 1: `React.cache()` en `lib/supabase/server.ts` (1 archivo, 10 min)

```typescript
// ANTES
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(/* ... */)
}

// DESPUÉS
import { cache } from "react"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const createClient = cache(async () => {
  const cookieStore = await cookies()
  return createServerClient(/* ... */)
})
```

`React.cache()` garantiza que múltiples `await createClient()` dentro de la misma request devuelvan exactamente el mismo objeto promesa. Efecto:

| Escenario | Antes | Después |
|-----------|-------|---------|
| `followUser` + `revalidateProfilePage` | 2 clientes | 1 cliente |
| `assertModerator` + `approveGame` | 2 clientes | 1 cliente |
| `generateMetadata` + `ProfilePage` | 2 clientes | 1 cliente |
| 12 pages con Navbar | 2 clientes | 1 cliente (cacheado) |

Impacto: **elimina ~15 instancias redundantes** sin cambiar una sola línea de las funciones que usan Supabase.

**Riesgo**: `React.cache()` es per-request. No hay riesgo de fuga entre requests. Perfectamente seguro.

### Fase 2: Eliminar `lib/supabase/client.ts` (1 archivo, 5 min)

El browser client ya es singleton por defecto en `@supabase/ssr`. Si nadie lo importa, es dead code. Opciones:

- **Opción A (recomendada)**: Mantener el archivo pero exportar directamente un singleton explícito, por claridad y en caso de que se necesite en el futuro. Agregar comentario.
- **Opción B**: Eliminar el archivo.
- **Decisión**: Opción A. Es pequeño, no duele mantenerlo, y documenta el patrón.

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"

// createBrowserClient ya es singleton por defecto (isSingleton: true).
// Esta función es un wrapper por claridad y para mantener consistencia.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Fase 3: Refactorizar `getUserRole` en `games.ts` para usar cliente cacheado (1 archivo, 15 min)

Actualmente:
```typescript
// Helper interno — crea su propio cliente
async function getUserRole(userId: string) {
  const supabase = await createClient()  // ← se cachea con React.cache()
  // ...
}
```

No necesita cambios si ya usamos `React.cache()`. El cliente se cachea automáticamente. **Solo** si queremos evitar la llamada extra a `getUser()`, deberíamos reestructurar. Pero el beneficio marginal es mínimo.

### Fase 4: Verificar build y comportamiento (15 min)

1. `npm run build` — debe compilar sin errores
2. Probar todas las operaciones: follow/unfollow, moderación, pages con metadatos
3. `git diff` para revisar cambios

## Árbol de decisión

```
¿createClient() en servidor?
  ├─ Llamada normal (page, action, componente) → React.cache() deduplica
  └─ Helper interno (revalidateProfilePage, getUserRole) → React.cache() deduplica igual

¿createClient() en browser?
  └─ createBrowserClient ya es singleton → solo mantener wrapper por claridad
```

## Estados de validación

| Estado | Qué verificar |
|--------|---------------|
| Build | `npm run build` exitoso |
| Follow/unfollow | Botón cambia, contador actualiza, listas correctas |
| Moderación | Aprobar/rechazar juego funciona |
| Perfiles | Páginas de perfil cargan con metadatos y datos |
| Login/logout | Sin errores de cookie/sesión |
| Browser | Sin errores de Hydration (singleton browser) |

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| `React.cache()` no deduplica en Server Actions | Baja | Está diseñado para RSC y Server Actions. Si falla, es un bug de Next.js, no nuestro. |
| Sesión compartida entre usuarios | Nula | `cache` es per-request, no global. |
| Regresión por cambio en `server.ts` | Baja | Solo se agrega `cache()` alrededor de la función existente. |

## Orden de implementación

1. `lib/supabase/server.ts` — agregar `React.cache()`
2. `npm run build` — verificar
3. `lib/supabase/client.ts` — agregar comentario de singleton
4. Probar en navegador con chrome-devtools
5. Deploy

## Criterios de aceptación

- [ ] Build exitoso sin errores TypeScript
- [ ] Follow/unfollow funciona correctamente en navegador
- [ ] Moderación de juegos funciona correctamente
- [ ] Páginas de perfil cargan con metadatos
- [ ] Navbar muestra username/avatar sin errores
- [ ] No hay errores de sesión/cookie en login/logout
- [ ] `lib/supabase/client.ts` documenta que es singleton (o se elimina)

## Métricas de éxito

| Antes | Después |
|-------|---------|
| 58 llamadas a `createClient()` en 21 archivos | 58 llamadas pero ~15 devuelven instancia cacheada |
| `social.ts`: 6 instancias por request de follow | `social.ts`: 4 instancias (mismo objeto) |
| `games.ts`: 9 funciones con 2 instancias c/u | `games.ts`: 9 funciones con 1 instancia c/u |
| `perfil/[username]/page.tsx`: 2 instancias | `perfil/[username]/page.tsx`: 1 instancia |
| Navbar + page: 2 instancias | Navbar + page: 1 instancia |
