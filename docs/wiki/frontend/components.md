---
title: "ArcadePlay — Inventario de Componentes Frontend"
tags: [frontend, architecture]
last_updated: "2026-07-27"
sources:
  - components/ProfileHeader.tsx
  - components/ProfileStats.tsx
  - components/ProfileTabs.tsx
  - components/ProfileGameCard.tsx
  - components/GameActionsInline.tsx
  - components/NavbarClient.tsx
  - components/ArcadeEmbed.tsx
  - components/GameTabs.tsx
  - app/globals.css
  - docs/raw/plans/2026-07-13-figma-adaptation.md
  - docs/raw/plans/2026-07-20-submit-form-dual-platform.md
  - docs/raw/plans/2026-07-20-submit-form-tags-redesign.md
  - docs/raw/plans/2026-07-21-draft-status.md
  - docs/raw/plans/2026-07-23-notification-system.md
  - docs/raw/plans/2026-07-23-header-redesign-search.md
  - docs/raw/plans/2026-07-23-live-search-dropdown.md
  - docs/raw/plans/2026-07-23-admin-banner-content.md
  - docs/raw/plans/2026-07-25-home-redesign-featured-sections.md
  - docs/raw/plans/2026-07-26-normalizar-tags-buscar.md
  - docs/raw/plans/2026-07-26-unificar-favoritos-en-perfil.md
  - components/
  - components/AccountForm.tsx
  - components/NavbarClient.tsx
  - components/FavoriteButton.tsx
  - components/CategoryFilter.tsx
  - components/FeaturedSection.tsx
  - components/GameCard.tsx
  - components/TrackView.tsx
  - components/RecentProjectsSection.tsx
  - components/PlatformBadge.tsx
  - lib/actions/search.ts
  - lib/actions/views.ts
  - lib/actions/ranking.ts
  - lib/actions/profile.ts
  - lib/actions/banner.ts
  - lib/actions/favorites.ts
  - lib/tag-utils.ts
  - lib/tag-icons.ts
  - lib/tag-colors.ts
  - lib/queries/games.ts
  - lib/definitions.ts
  - app/(public)/page.tsx
  - app/(public)/buscar/page.tsx
  - app/(protected)/cuenta/page.tsx
  - app/(protected)/admin/banner/banner-admin-client.tsx
---

# ArcadePlay — Inventario de Componentes Frontend

## Layout

| Componente | Archivo | Tipo | Descripción |
|-----------|---------|------|-------------|
| RootLayout | `app/layout.tsx` | Server | Metadata, fonts (Geist), Toaster |
| PublicLayout | `app/(public)/layout.tsx` | Server | Navbar + main + Footer |
| ProtectedLayout | `app/(protected)/layout.tsx` | Server | Verifica sesión, navbar + footer |

## Componentes de página

| Ruta | Archivo | Componentes que usa |
|------|---------|-------------------|
| `/` | `app/(public)/page.tsx` | HeroSlider, CuratedSection (×3), RankingSection |
| `/juego/[id]` | `app/(public)/juego/[id]/page.tsx` | GameTabs, TrackView, Rating, FavoriteButton, Badge (coloreado por categoría), GameCard, getGamesByAuthor, getTagColor |
| `/perfil/[username]` | `app/(public)/perfil/[username]/page.tsx` | ProfileHeader, ProfileTabs, ProfileGameCard, ProfileBadges |
| `/login` | `app/(public)/login/page.tsx` | LoginForm |
| `/signup` | `app/(public)/signup/page.tsx` | SignUpForm |
| `/subir` | `app/(protected)/subir/page.tsx` | SubmitGameForm |
| `/dashboard` | `app/(protected)/dashboard/page.tsx` | Redirección pura: busca username y redirige a `/perfil/{username}`. No renderiza UI |
| `/cuenta` | `app/(protected)/cuenta/page.tsx` | AccountForm (info + editar inline), ChangePasswordForm — cambiar contraseña |
| `/editar/[id]` | `app/(protected)/editar/[id]/page.tsx` | EditGameForm |
| `/moderar` | `app/(protected)/moderar/page.tsx` | ModeratorDashboard — panel de moderación con tabs, acciones CRUD (aprobar/rechazar con motivo/volver a pendiente/ocultar/eliminar) |
| `/admin/usuarios` | `app/(protected)/admin/usuarios/page.tsx` | AdminUsersClient — gestión de roles de usuarios |
| `/admin/banner` | `app/(protected)/admin/banner/page.tsx` | BannerAdminClient — gestión de slides del banner del home con preview en vivo, color pickers y opciones de panel (visibilidad, alineación, modo botón) |

## Componentes compartidos

### Navegación

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| Navbar | `components/Navbar.tsx` | Server | Fetches `user` + `username` + `avatar_url` + `role` + `unreadCount` + `recentNotifications`, renderiza `NavbarClient` |
| NavbarClient | `components/NavbarClient.tsx` | Client | `{ user, username, avatarUrl, role, unreadCount, recentNotifications, currentUserId }` — scroll shadow, **menú hamburguesa flotante** (solo logueado; no logueado muestra "Iniciar sesión" + "Registrarse" en header), ThemeToggle siempre visible (mobile + desktop sincronizados vía evento custom), search input con live dropdown, avatar con dropdown unificado, bell icon con badge + dropdown de notificaciones. Usa `useRealtimeNotifications` |
| AuthButton | `components/AuthButton.tsx` | Client | Form action `signOut` |
| Footer | `components/Footer.tsx` | Server | Links estáticos en 2 columnas (makecode, subir, categorías, login, sobre, términos) |

> [!note] Navbar: fondo `arcade-red`, texto `arcade-beige`. Desktop layout: `[Logo] [Search input con live dropdown] [Upload] [Bell] [Avatar + dropdown]`. Iconos homogéneos con `variant="ghost"` beige sobre rojo. Mobile: search input + hamburger con todos los links. [[design-tokens]]

> [!note] Footer: mismo componente en layouts público y protegido. Fondo `arcade-red`, links en beige, 2 columnas. Logo centrado. [[design-tokens]]

### Secciones del Home

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| HeroSlider | `components/HeroSlider.tsx` | Client | `slides: Slide[]` — auto-play 5s con fade `transition-all duration-500`. Todos los slides apilados con CSS Grid. Fallback a 3 defaults. `Slide` interface simplificada: solo `template` (`bar-right`, `bar-left`, `full-image`). BarSlide: split 25/75 con colores dominantes extractados vía `useDominantColors()`. Fondo con gradiente de 2 colores oscuros extraídos de la imagen (k-means, canvas 32×32). Desktop `md:aspect-[3/1]` flex-row. Mobile flex-col con altura auto para contenido + aspect-video para imagen. |
| FeaturedSection | `components/FeaturedSection.tsx` | Server | `games: FeaturedGameData[]` — grid de 4 juegos destacados. Título con icono `Flame` (🔥) en `text-arcade-red`. `FeaturedCard` inline: imagen en `aspect-video` con dos burbujas: `PlatformBadge`(logo SVG) en top-left + tag de categoría coloreado en top-right. Panel de info debajo con fondo `bg-[rgba(52,54,53,0.96)]`. Fila 1: título truncado + estrellas amarillas. Fila 2: `Por {author}` + visitas. Header con "Ver todos →" a `/buscar?sort=rated`. |
| CategoryExplorer | `components/CategoryExplorer.tsx` | Client | `tags: Tag[], showAll: boolean, onShowAll: () => void` — grid de categorías clickeables. Título con icono `Grid3X3` (⊞) en `text-arcade-red`. Incluye MakeCode Arcade y Scratch al inicio con sus logos SVG oficiales (`MakeCodeLogo` / `ScratchLogo` desde `PlatformBadge`). Las categorías restantes usan íconos Lucide (`getTagIcon()` en `lib/tag-icons.ts`). El círculo del icono se pinta con `getTagColor()` (fondo 10% opacidad + icono color sólido). Plataformas igual: atenuadas para mezclarse. Muestra 8 categorías + botón "Ver más" (9 items visibles). Al expandir: todas las categorías + botón "Mostrar menos" al final. Ambos botones estilizados como CategoryCards (misma altura, padding, icon circle). Scroll suave al expandir. Navega a `/buscar?tag=<slug>`. Orden: MakeCode Arcade → Scratch → resto alfabético. |
| RecentProjectsSection | `components/RecentProjectsSection.tsx` | Client | `games: RecentGameData[], showAll?: boolean` — proyectos recientes en cards mini con thumbnail 112px + info column centrada verticalmente. Título con icono `Sparkles` (✨) en `text-arcade-red`. Fila 1: título + estrellas amarillas (`fill-yellow-400`) a la derecha. Fila 2: `por {author}` + platform icon + visitas a la derecha. Sin expandir: 3 juegos. Con `showAll=true`: hasta 5 juegos. Encerrado en `border bg-card` con `divide-y`. Header con "Ver todos →" a `/buscar?sort=recent`. |
| CategoryRecentSection | `components/CategoryRecentSection.tsx` | Client | `tags: Tag[], recentGames: RecentGameData[]` — wrapper del grid 2-columnas que mantiene estado `showAll` compartido entre `CategoryExplorer` y `RecentProjectsSection`. Al hacer clic en "Ver más" / "Mostrar menos" en Categorías, también expande/colapsa Novedades (toggle). Incluye `CategoryRecentSectionSkeleton` combinado. |
| HeroSliderWrapper | `app/(public)/page.tsx` | Server | Wrapper que fetchea `getActiveBannerSlides()` y mapea al formato `Slide`. Si no hay slides en DB, pasa `undefined` para que HeroSlider use defaults |
| CuratedSection | `components/CuratedSection.tsx` | Server | `{ title, games[] }` — overflow-x scroll con snap |
| CuratedSectionSkeleton | `components/CuratedSection.tsx` | Server | 4 placeholders animados |
| GameThumbnail | `components/GameThumbnail.tsx` | Server | `{ game: GameThumbnailData }` — overlay oscuro + rating |
| GameCard | `components/GameCard.tsx` | Server | `game: GameWithDetails` — imagen en `aspect-video` con dos burbujas: `PlatformBadge`(logo SVG) en top-left + tag de categoría coloreado en top-right. Panel de info debajo con fondo `bg-[rgba(52,54,53,0.96)]`. Fila 1: título truncado + estrellas amarillas. Fila 2: `Por {username}` + visitas. Usa `getTagColor()` y `PlatformBadge`. |
| GameGrid | `components/GameGrid.tsx` | Server | `games[]` — grid responsive 2-5 columnas |
| LoadMoreGames | `components/LoadMoreGames.tsx` | Client | Paginación "Cargar más" vía server action |
| ArcadeEmbed | `components/ArcadeEmbed.tsx` | Client | `url, title, sandbox?, showFullConsole?` — iframe responsivo: `aspect-[3/4]` (móvil, consola completa) / `aspect-[4/3]` (desktop). Si `showFullConsole=false` usa `aspect-[4/3]` en todos los tamaños. Loading/error state |
| ScratchEmbed | `components/ScratchEmbed.tsx` | Client | `url, title` — iframe con `allowtransparency`, aspect ratio 6:5, loading/error state. Sin sandbox (no necesario para Scratch) |
| GameTabs | `components/GameTabs.tsx` | Client | `gameId, title, platform, embedUrl?` — tabs adaptativos. MakeCode: Juego + Editor. Scratch: solo Juego. **Botón toggle de vista** (Monitor/Smartphone) al final de la barra: alterna entre consola completa (`aspect-[3/4]`, default) y solo pantalla (`aspect-[4/3]`). Pasa `showFullConsole` a ArcadeEmbed |
| TrackView | `components/TrackView.tsx` | Client | `{ gameId: string }` — componente invisible que incrementa contador de visitas del juego al montarse. Usa `useRef` guard para evitar doble disparo en Strict Mode. Renderiza `null`. |
| RankingSection | `components/RankingSection.tsx` | Server | `{ players: PlayerRankingEntry[] }` — ranking real conectado a DB. Título con icono `Trophy` (🏆) en `text-arcade-red`. Podio (top 3) + lista (#4-#50). Diseño limpio con border bg-card shadow-sm. Empty state cuando no hay ratings |
| PodiumCard | `components/PodiumCard.tsx` | Server | `{ topPlayers: PlayerRankingEntry[] }` — top 3 en layout tipo podio escalonado: 2° | 1° (featured) | 3°. Flexbox con superposición ligera vía márgenes negativos (`-mx-10px sm:-mx-16px`). 1° lugar con `z-10` por encima de los otros. Efecto escalón: spacer sobre 2° (`h-8 sm:h-10`) y 3° (`h-14 sm:h-20`). Progresión de tamaño: 1° más grande (padding, trofeo, texto), 2° mediano, 3° más chico. Badges con colores sólidos: 1° `bg-amber-400` (dorado), 2° `bg-gray-400` (plateado), 3° `bg-orange-500` (cobre) — matching borders. Nombre de usuario linkea a `/perfil/{username}` con hover `text-arcade-red`. |
| TagPicker | `components/TagPicker.tsx` | Client | `tags[], selectedIds, onChange, lockedIds?, max?` — visual multi-select de tags. Burbujas coloridas seleccionables, locked tags con candado, check icon en seleccionados. Rotación de 8 colores |
| SubmitGameForm | `components/SubmitGameForm.tsx` | Client | `tags[]` — Step 1: selector visual de plataforma con logos SVG oficiales (`MakeCodeLogo` en `#F76820`, `ScratchLogo` en `#F9A83A`) y links externos a las herramientas centrados debajo de cada tarjeta. `cursor-pointer` en las cards. Step 2: formulario 2 columnas (inputs izquierda, preview derecha sticky). TagPicker integrado (platform tag locked). ThumbnailPicker siempre visible. Server action `createGame` con `tag_ids`. Dos botones submit: "Publicar" (`action=publish`) y "Guardar borrador" (`action=draft`) |
| ThumbnailPicker | `components/ThumbnailPicker.tsx` | Client | `shortId, embedUrl, onThumbnailChange, platform?, currentThumbnailUrl?` — 2 fuentes: auto MakeCode (vía API), subida manual. Para Scratch solo subida manual. Límite de subida: **5 MB**. Errores visibles al usuario vía `toast` (destructive) en vez de `console.error`. Soporta pre-carga de thumbnail existente para modo edición |
| DashboardCard | `components/DashboardCard.tsx` | Client | `{ game: GameWithDetails }` — card horizontal con thumbnail, status badge, stats (vistas, rating, fecha), acciones (jugar, editar, ocultar, eliminar). Colores según estado: verde=publicado, ámbar=pendiente, gris=oculto, rojo=rechazado, gris claro=borrador. Si `game.status === "draft"`, muestra botón "Publicar" que llama a `publishGame` |
| EditGameForm | `components/EditGameForm.tsx` | Client | `{ game, tags[] }` — formulario pre-cargado con preview (ArcadeEmbed o ScratchEmbed según platform), ThumbnailPicker, TagPicker con tags actuales precargadas. Server action `updateGame` con tags |

### Paginación y Ordenamiento

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| NumericPagination | `components/NumericPagination.tsx` | Server | `currentPage, totalPages, basePath, searchParams?` — links de paginación numérica con `<Link>` (0 JS). Muestra páginas con elipsis, botones anterior/siguiente con ChevronLeft/ChevronRight. Página activa con `bg-primary`. 0-based internamente, 1-based display. |
| SortSelect | `components/SortSelect.tsx` | Client | Sin props — dropdown que actualiza `?sort=` en URL. Opciones: "Más recientes" (recent), "Más jugados" (popular), "Mejor valorados" (rated). Resetea `?page=` al cambiar. **Bug**: al seleccionar "Más recientes" elimina `sort=recent` en vez de ponerlo — mitigado por `isBrowse = !q` en `/buscar`. Usa `useSearchParams()` + `usePathname()` para redirigir a la ruta actual — funciona en `/` y `/buscar`. Suspense boundary requerido. |
| PlatformBadge | `components/PlatformBadge.tsx` | Server | `platform: "makecode" | "scratch"` — burbuja flotante top-left con el logo oficial SVG de la plataforma. Span con `text-white` para que los SVGs se vean blancos sobre fondo sólido. `MakeCodeLogo` usa `fill="currentColor"` (hereda `text-white` → blanco sobre `#F76820`; en CategoryCard hereda `#F76820` sobre fondo 10%). `ScratchLogo` usa colores hardcodeados (`#fff`, `#F9A83A`, `#fff`) para preservar el logo multi-color. Ambos logos se exportan (`MakeCodeLogo`, `ScratchLogo`) para reuso en `CategoryExplorer`. |
| TagFilter | `components/CategoryFilter.tsx` | Client | `tags: Tag[]` — botones de filtro por categoría (`?tag=<slug>`). El botón activo se pinta con el color de la categoría (`getTagColor().badge` como fondo + texto blanco). Botón "Todas" que navega a `/buscar?sort=recent`. Usa `keepBrowseMode()`. Resetea `?page=` al cambiar de tag. |

### Server Actions (games / thumbnails)

| Acción | Archivo | Propósito |
|--------|---------|-----------|
| `createGame` | `lib/actions/games.ts` | Crea juego (MakeCode o Scratch según URL). Acepta `thumbnail_url`, `tag_ids[]`, guarda `platform`, inserta `game_tags` |
| `toggleVisibility` | `lib/actions/games.ts` | Oculta/muestra juego |
| `deleteGame` | `lib/actions/games.ts` | Elimina juego |
| `uploadThumbnail` | `lib/actions/thumbnails.ts` | Sube imagen a Supabase Storage → URL pública. Límite: 5 MB, formatos: PNG/JPEG/WebP. Valida autenticación, tipo MIME y tamaño |
| `updateGame` | `lib/actions/games.ts` | Edita título, descripción, categoría y miniatura de un juego (solo dueño) |
| `incrementGameView` | `lib/actions/views.ts` | Incrementa contador de visitas de un juego (read + write). Llamado desde `TrackView` al montar la página del juego |

### Perfil

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| ProfileHeader | `components/ProfileHeader.tsx` | Server | `{ profile: ProfileWithStats, isOwnProfile, isFollowing }` — avatar, username, bio, website y botón follow en layout **lado a lado en todas las resoluciones** (`flex-row items-start`). Debajo: `ProfileStats` con 4 stat cards en grid responsivo |
| ProfileBadges | `components/ProfileBadges.tsx` | Server | `{ badges: { badges: Badge }[] }` — grid de emblemas con hover tooltip. Se oculta si no hay badges |
| ProfileGameCard | `components/ProfileGameCard.tsx` | Client | `{ game: GameWithDetails, isOwner, isModOrAdmin?, showAuthor?, hideBadge? }` — card con thumbnail + grid 2 columnas. Botones de acción **compactos responsivos** (`size-6 sm:size-8`, iconos `size-3 sm:size-3.5`) en una sola fila. Botones: jugar (siempre), editar/ocultar/eliminar (dueño), publicar borrador (drafts). `showAuthor` muestra "por @username". `hideBadge` oculta badge de estado |
| ModeratorGameActions | `components/ModeratorGameActions.tsx` | Client | `{ game: GameWithDetails }` — botones Aprobar (pendiente), Rechazar (pendiente), Eliminar (aprobado/rechazado) para moderadores en perfiles ajenos |
| ProfileTabs | `components/ProfileTabs.tsx` | Client | `{ games[], badges[], favoritedGames?, isOwner, isModOrAdmin? }` — tabs "Juegos" (default) y "Logros" (solo si tiene badges). Cuando `isOwner=true`: **filtros de estado en pills** (`flex-wrap`, `rounded-full`, `bg-primary` el activo) — sin scroll horizontal. Filtros: Todos mis Juegos / Publicados / En moderación / Rechazados / Borradores / Favoritos. "Favoritos" unificado como filtro (ex-pestaña separada). Favoritos renderizados con `ProfileGameCard` en modo vista (`isOwner={false}`, `showAuthor`, `hideBadge`) |
| FollowButton | `components/FollowButton.tsx` | Client | `{ targetUserId, isFollowing }` — botón Seguir/Siguiendo con useActionState |
| GameActionsInline | `components/GameActionsInline.tsx` | Client | `ToggleVisibilityButton(gameId, hidden)` y `DeleteGameButton(gameId)` — botones **responsivos** (`size-6 sm:size-8`, iconos `size-3 sm:size-3.5`). Wrappers useActionState |
| FavoriteButton | `components/FavoriteButton.tsx` | Client | `{ gameId, isFavorited, isAuthenticated, favoriteCount }` — corazón toggle con contador. Muestra `(♥) N`. Tres estados: no autenticado (deshabilitado), sin favorito (outline), favoritado (relleno rojo `fill-red-500`). Usa `useState` con optimistic updates (incrementa/decrementa contador local antes de la server action, revierte en error). Se oculta si el usuario es el dueño del juego |

### Auth

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| LoginForm | `components/LoginForm.tsx` | Client | `useActionState(signIn)` — campo "Usuario o email" (acepta username o email), contraseña con toggle de visibilidad (Eye/EyeOff) |
| SignUpForm | `components/SignUpForm.tsx` | Client | `useActionState(signUp)` + `useActionState(resendVerificationEmail)`. Campos: username (sanitizado), email, password + confirmación (con toggle de visibilidad), mes/año de nacimiento, país (selector ISO). Pantalla de éxito con reenvío de email |
| AccountForm | `components/AccountForm.tsx` | Client | `{ profile: Profile }` — vista info + edición inline. Modo vista: avatar + username + email + bio + fecha + país + creada con botón "Editar perfil" en header. Modo edición: formulario con avatar upload, username checker, bio, fecha, país. Vuelve a vista al guardar exitosamente |
| ChangePasswordForm | `components/ChangePasswordForm.tsx` | Client | Formulario independiente con nueva contraseña + confirmación (ambos con toggle de visibilidad). Server action `updatePassword` |

### UI (shadcn)

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| Button | `components/ui/button.tsx` | Botones con variantes |
| Card | `components/ui/card.tsx` | Contenedores de contenido |
| Input | `components/ui/input.tsx` | Campos de texto |
| Badge | `components/ui/badge.tsx` | Tags y categorías |
| Skeleton | `components/ui/skeleton.tsx` | Loading states |
| Separator | `components/ui/separator.tsx` | Divisores |
| Avatar | `components/ui/avatar.tsx` | Avatares de usuario |
| Dialog | `components/ui/dialog.tsx` | Modales |
| Select | `components/ui/select.tsx` | Selectores |
| Textarea | `components/ui/textarea.tsx` | Áreas de texto multi-línea |
| Label | `components/ui/label.tsx` | Labels de formulario |
| Toast/Toaster | `components/ui/toast.tsx` | Notificaciones |
| Rating | `components/Rating.tsx` | Botón unificado `(⭐) N` con toggle de estrella única + contador |
| ThemeToggle | `components/ThemeToggle.tsx` | Toggle Sol/Luna para cambiar modo claro/oscuro. Usa `useState` + `useEffect` para hidratación segura, `localStorage` para persistencia. Ubicado en NavbarClient: **siempre visible** (logueado y no logueado, tanto desktop como mobile). |

## Hooks

| Hook | Archivo | Propósito |
|------|---------|-----------|
| use-debounce | `hooks/use-debounce.ts` | Debounce genérico (300ms en SearchBar) |
| use-toast | `hooks/use-toast.ts` | Estado global de toasts |
| useRealtimeNotifications | `hooks/use-realtime-notifications.ts` | Suscripción Realtime a INSERT/UPDATE en `notifications` |
| useDominantColors | `hooks/use-dominant-colors.ts` | Extrae 2 colores dominantes de una imagen vía k-means (k=2, 4 iteraciones, canvas 32×32). Oscurece colores a ≤35% luminosidad para fondos con texto blanco. Cachea resultados por URL. |

## Rutas

| Ruta | Archivo | Modos | Descripción |
|------|---------|-------|-------------|
| `/` | `app/(public)/page.tsx` | Home | HeroSlider + FeaturedSection (🔥) + CategoryRecentSection (⊞ Categorías | ✨ Novedades) + RankingSection (🏆) + **Todos los juegos** (🎮 preview de 8 juegos + botón "Ver Más →" a `/buscar?sort=recent`). Cada título de sección lleva un icono lucide-react en `text-arcade-red`. **Sin** TagFilter, SortSelect, SearchBar ni paginación. Sin search params. |
| `/buscar` | `app/(public)/buscar/page.tsx` | Browse / Búsqueda textual | **Browse** — `?sort=rated` (Mejor valorados), `?sort=recent` (Novedades), `?sort=popular` (Más jugados) o `?tag=<slug>` (filtro por categoría). `isBrowse = !q` (cualquier combinación de sort/tag/page sin q activa browse mode). Incluye SortSelect + TagFilter + paginación numérica (12 juegos/pág). Los slugs de tags se resuelven a UUIDs internamente vía `resolveTagSlug()` en `lib/queries/games.ts`. **Búsqueda textual** — con `?q=`, busca juegos/usuarios/tags. Sin params: browse mode activo (no empty state). |

## Server Actions

| Action | Archivo | Propósito |
|--------|---------|-----------|
| createGame | `lib/actions/games.ts` | Publicar juego con tags (award badges automáticos) |
| updateGame | `lib/actions/games.ts` | Editar juego + tags (solo dueño) |
| toggleVisibility | `lib/actions/games.ts` | Ocultar/mostrar juego (solo dueño) |
| deleteGame | `lib/actions/games.ts` | Eliminar juego (solo dueño) |
| getPendingGames | `lib/actions/games.ts` | Listar juegos pendientes de moderación |
| getModeratedGames | `lib/actions/games.ts` | Listar juegos filtrados por status (moderador) |
| approveGame | `lib/actions/games.ts` | Aprobar juego (moderador) |
| rejectGame | `lib/actions/games.ts` | Rechazar juego con motivo opcional (moderador) |
| revertToPending | `lib/actions/games.ts` | Volver juego aprobado a pendiente (moderador) |
| publishGame | `lib/actions/games.ts` | Publicar borrador → lo envía a `pending` (desarrollador) |
| modToggleVisibility | `lib/actions/games.ts` | Oculta/muestra cualquier juego (moderador) |
| modDeleteGame | `lib/actions/games.ts` | Eliminar cualquier juego (moderador) |
| getUsers | `lib/actions/games.ts` | Listar usuarios con búsqueda (admin) |
| setUserRole | `lib/actions/games.ts` | Cambiar rol de usuario (admin) |
| getGames | `lib/actions/games.ts` | Listar juegos (búsqueda, filtro por tags, paginación) |
| getGameById | `lib/actions/games.ts` | Detalle de juego + tags + ratings + favorites_count |
| getUserGames | `lib/actions/games.ts` | Juegos públicos de un usuario |
| getMyGames | `lib/actions/games.ts` | Juegos del usuario actual |
| getRecentGames | `lib/actions/games.ts` | Últimos juegos (ordenados por created_at) |
| getMostPlayed | `lib/actions/games.ts` | Juegos por views |
| getTopRated | `lib/actions/games.ts` | Juegos por avg_rating |
| getPlayerLeaderboard | `lib/actions/ranking.ts` | Ranking global de jugadores por suma de ratings recibidos |
| rateGame | `lib/actions/ratings.ts` | Votar juego (upsert, award badges al votante y al dueño) |
| uploadThumbnail | `lib/actions/thumbnails.ts` | Subir miniatura a Supabase Storage |
| getProfileByUsername | `lib/actions/profile.ts` | Perfil completo con stats computadas (juegos, estrellas, avg rating, seguidores, siguiendo, badges) |
| updateMyProfile | `lib/actions/profile.ts` | Editar bio, website, avatar |
| updateAccount | `lib/actions/profile.ts` | Editar perfil completo (username, bio, avatar upload a Storage, birth_month, birth_year, country). Valida unicidad de username |
| updatePassword | `lib/actions/profile.ts` | Cambiar contraseña (validación de fortaleza, `supabase.auth.updateUser`) |
| checkUsername | `lib/actions/profile.ts` | Verifica disponibilidad de username (case-insensitive). Retorna `{ available: boolean }` |
| followUser | `lib/actions/social.ts` | Seguir usuario (también dispara notificación `new_follower`) |
| unfollowUser | `lib/actions/social.ts` | Dejar de seguir usuario |
| getUnreadCount | `lib/actions/notifications.ts` | Contador de notificaciones no leídas |
| getNotifications | `lib/actions/notifications.ts` | Lista paginada de notificaciones |
| getRecentNotifications | `lib/actions/notifications.ts` | Últimas 5 notificaciones para dropdown |
| markAsRead | `lib/actions/notifications.ts` | Marcar una notificación como leída |
| markAllAsRead | `lib/actions/notifications.ts` | Marcar todas como leídas |
| isFollowing | `lib/actions/social.ts` | Check si el usuario autenticado sigue a otro |
| getFollowers | `lib/actions/social.ts` | Lista de seguidores de un usuario |
| getFollowing | `lib/actions/social.ts` | Lista de seguidos de un usuario |
| checkAndAwardBadges | `lib/actions/badges.ts` | Evaluar y otorgar badges según logros |
| getAllBadges | `lib/actions/badges.ts` | Listar catálogo de badges |
| signIn | `lib/actions/auth.ts` | Iniciar sesión |
| signUp | `lib/actions/auth.ts` | Registrarse con sanitización, validación de password y campos de perfil (birth_month, birth_year, country) |
| resendVerificationEmail | `lib/actions/auth.ts` | Reenviar email de verificación |
| signOut | `lib/actions/auth.ts` | Cerrar sesión |
| searchAll | `lib/actions/search.ts` | Búsqueda multi-entidad (juegos, usuarios, tags) con ILIKE. 3 queries paralelas. Límite 8 por entidad |
| getBannerSlides | `lib/actions/banner.ts` | Obtener todos los slides (admin) |
| getActiveBannerSlides | `lib/actions/banner.ts` | Obtener slides activos para la home |
| createBannerSlide | `lib/actions/banner.ts` | Crear nuevo slide (admin) |
| updateBannerSlide | `lib/actions/banner.ts` | Actualizar slide existente (admin) |
| deleteBannerSlide | `lib/actions/banner.ts` | Eliminar slide (admin) |
| reorderBannerSlides | `lib/actions/banner.ts` | Reordenar slides (admin) |
| uploadBannerImage | `lib/actions/banner.ts` | Subir imagen al bucket `banners` (admin) |
| toggleFavorite | `lib/actions/favorites.ts` | Agregar/quitar favorito (INSERT/DELETE en `favorites`). Rechaza con error si el usuario es el dueño del juego (verificado server-side). Si agrega, dispara notificación `new_favorite` al dueño del juego |
| isFavorited | `lib/actions/favorites.ts` | Check si el usuario autenticado tiene un juego como favorito (booleano) |
| getUserFavorites | `lib/actions/favorites.ts` | Lista de juegos favoritos de un usuario (solo aprobados + visibles) |
