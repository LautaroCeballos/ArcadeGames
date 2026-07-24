---
title: "ArcadePlay — Inventario de Componentes Frontend"
tags: [frontend, architecture]
last_updated: "2026-07-23"
sources:
  - docs/raw/plans/2026-07-13-figma-adaptation.md
  - docs/raw/plans/2026-07-20-submit-form-dual-platform.md
  - docs/raw/plans/2026-07-20-submit-form-tags-redesign.md
  - docs/raw/plans/2026-07-21-draft-status.md
  - docs/raw/plans/2026-07-23-notification-system.md
  - docs/raw/plans/2026-07-23-header-redesign-search.md
  - docs/raw/plans/2026-07-23-live-search-dropdown.md
  - docs/raw/plans/2026-07-23-admin-banner-content.md
  - components/
  - components/AccountForm.tsx
  - components/NavbarClient.tsx
  - lib/actions/search.ts
  - lib/actions/ranking.ts
  - lib/actions/profile.ts
  - lib/actions/banner.ts
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
| `/juego/[id]` | `app/(public)/juego/[id]/page.tsx` | GameTabs, Rating, Badge |
| `/perfil/[username]` | `app/(public)/perfil/[username]/page.tsx` | ProfileHeader, ProfileTabs, ProfileGameCard, ProfileBadges |
| `/login` | `app/(public)/login/page.tsx` | LoginForm |
| `/signup` | `app/(public)/signup/page.tsx` | SignUpForm |
| `/subir` | `app/(protected)/subir/page.tsx` | SubmitGameForm |
| `/dashboard` | `app/(protected)/dashboard/page.tsx` | Redirección pura: busca username y redirige a `/perfil/{username}`. No renderiza UI |
| `/cuenta` | `app/(protected)/cuenta/page.tsx` | AccountForm (info + editar inline), ChangePasswordForm — cambiar contraseña |
| `/editar/[id]` | `app/(protected)/editar/[id]/page.tsx` | EditGameForm |
| `/moderar` | `app/(protected)/moderar/page.tsx` | ModeratorDashboard — panel de moderación con tabs, acciones CRUD (aprobar/rechazar con motivo/volver a pendiente/ocultar/eliminar) |
| `/admin/usuarios` | `app/(protected)/admin/usuarios/page.tsx` | AdminUsersClient — gestión de roles de usuarios |
| `/admin/banner` | `app/(protected)/admin/banner/page.tsx` | BannerAdminClient — gestión de slides del banner del home |

## Componentes compartidos

### Navegación

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| Navbar | `components/Navbar.tsx` | Server | Fetches `user` + `username` + `avatar_url` + `role` + `unreadCount` + `recentNotifications`, renderiza `NavbarClient` |
| NavbarClient | `components/NavbarClient.tsx` | Client | `{ user, username, avatarUrl, role, unreadCount, recentNotifications, currentUserId }` — scroll shadow, menú hamburguesa, **search input con live dropdown** (debounce 500ms, resultados en tiempo real), avatar con dropdown unificado (perfil, cuenta, moderar, admin, cerrar sesión), bell icon con badge + dropdown de notificaciones. Usa `useRealtimeNotifications` |
| AuthButton | `components/AuthButton.tsx` | Client | Form action `signOut` |
| Footer | `components/Footer.tsx` | Server | Links estáticos en 2 columnas (makecode, subir, categorías, login, sobre, términos) |

> [!note] Navbar: fondo `arcade-red`, texto `arcade-beige`. Desktop layout: `[Logo] [Search input con live dropdown] [Upload] [Bell] [Avatar + dropdown]`. Iconos homogéneos con `variant="ghost"` beige sobre rojo. Mobile: search input + hamburger con todos los links. [[design-tokens]]

> [!note] Footer: mismo componente en layouts público y protegido. Fondo `arcade-red`, links en beige, 2 columnas. Logo centrado. [[design-tokens]]

### Juegos

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| HeroSlider | `components/HeroSlider.tsx` | Client | `slides[]` — useState + useEffect para auto-play 5s. Fallback a 3 slides default si no hay datos. Ahora recibe slides desde DB vía `getActiveBannerSlides()` en home page |
| HeroSliderWrapper | `app/(public)/page.tsx` | Server | Wrapper que fetchea `getActiveBannerSlides()` y mapea al formato `Slide`. Si no hay slides en DB, pasa `undefined` para que HeroSlider use defaults |
| CuratedSection | `components/CuratedSection.tsx` | Server | `{ title, games[] }` — overflow-x scroll con snap |
| CuratedSectionSkeleton | `components/CuratedSection.tsx` | Server | 4 placeholders animados |
| GameThumbnail | `components/GameThumbnail.tsx` | Server | `{ game: GameThumbnailData }` — overlay oscuro + rating |
| GameCard | `components/GameCard.tsx` | Server | `game: GameWithDetails` — estilo thumbnail con badge categoría |
| GameGrid | `components/GameGrid.tsx` | Server | `games[]` — grid responsive 2-5 columnas |
| LoadMoreGames | `components/LoadMoreGames.tsx` | Client | Paginación "Cargar más" vía server action |
| ArcadeEmbed | `components/ArcadeEmbed.tsx` | Client | `url, title, sandbox?` — iframe 4:3 con loading/error state. Soporta `sandbox` opcional para restringir permisos del embed |
| ScratchEmbed | `components/ScratchEmbed.tsx` | Client | `url, title` — iframe con `allowtransparency`, aspect ratio 6:5, loading/error state. Sin sandbox (no necesario para Scratch) |
| GameTabs | `components/GameTabs.tsx` | Client | `gameId, title, platform, embedUrl?` — tabs adaptativos. MakeCode: Juego + Editor. Scratch: solo Juego (embed directo) |
| RankingSection | `components/RankingSection.tsx` | Server | `{ players: PlayerRankingEntry[] }` — ranking real conectado a DB. Podio (top 3) + lista (#4-#50). Diseño limpio con border bg-card shadow-sm. Empty state cuando no hay ratings |
| PodiumCard | `components/PodiumCard.tsx` | Server | `{ topPlayers: PlayerRankingEntry[] }` — top 3 en cards individuales: 2° | 1° (featured) | 3°. Trofeos + estrellas + badges de posición |
| TagPicker | `components/TagPicker.tsx` | Client | `tags[], selectedIds, onChange, lockedIds?, max?` — visual multi-select de tags. Burbujas coloridas seleccionables, locked tags con candado, check icon en seleccionados. Rotación de 8 colores |
| SubmitGameForm | `components/SubmitGameForm.tsx` | Client | `tags[]` — Step 1: selector visual de plataforma (MakeCode/Scratch). Step 2: formulario 2 columnas (inputs izquierda, preview derecha sticky). TagPicker integrado (platform tag locked). ThumbnailPicker siempre visible. Server action `createGame` con `tag_ids`. Dos botones submit: "Publicar" (`action=publish`) y "Guardar borrador" (`action=draft`) |
| ThumbnailPicker | `components/ThumbnailPicker.tsx` | Client | `shortId, embedUrl, onThumbnailChange, platform?` — 2 fuentes: auto MakeCode (vía API), subida manual. Para Scratch solo subida manual |
| DashboardCard | `components/DashboardCard.tsx` | Client | `{ game: GameWithDetails }` — card horizontal con thumbnail, status badge, stats (vistas, rating, fecha), acciones (jugar, editar, ocultar, eliminar). Colores según estado: verde=publicado, ámbar=pendiente, gris=oculto, rojo=rechazado, gris claro=borrador. Si `game.status === "draft"`, muestra botón "Publicar" que llama a `publishGame` |
| EditGameForm | `components/EditGameForm.tsx` | Client | `{ game, tags[] }` — formulario pre-cargado con preview (ArcadeEmbed o ScratchEmbed según platform), ThumbnailPicker, TagPicker con tags actuales precargadas. Server action `updateGame` con tags |

### Server Actions (games / thumbnails)

| Acción | Archivo | Propósito |
|--------|---------|-----------|
| `createGame` | `lib/actions/games.ts` | Crea juego (MakeCode o Scratch según URL). Acepta `thumbnail_url`, `tag_ids[]`, guarda `platform`, inserta `game_tags` |
| `toggleVisibility` | `lib/actions/games.ts` | Oculta/muestra juego |
| `deleteGame` | `lib/actions/games.ts` | Elimina juego |
| `uploadThumbnail` | `lib/actions/thumbnails.ts` | Sube imagen a Supabase Storage → URL pública |
| `updateGame` | `lib/actions/games.ts` | Edita título, descripción, categoría y miniatura de un juego (solo dueño) |

### Perfil

| Componente | Archivo | Tipo | Props clave |
|-----------|---------|------|-------------|
| ProfileHeader | `components/ProfileHeader.tsx` | Server | `{ profile: ProfileWithStats, isOwnProfile, isFollowing }` — avatar grande, username, bio, website, 4 stat cards (estrellas, juegos, seguidores, siguiendo), botón follow |
| ProfileBadges | `components/ProfileBadges.tsx` | Server | `{ badges: { badges: Badge }[] }` — grid de emblemas con hover tooltip. Se oculta si no hay badges |
| ProfileGameCard | `components/ProfileGameCard.tsx` | Client | `{ game: GameWithDetails, isOwner, isModOrAdmin? }` — card con thumbnail, status badge, vistas/rating/fecha, motivo de rechazo si aplica (`rejection_reason`), acciones (jugar, editar, ocultar, eliminar solo si es dueño; si es moderador/admin muestra `ModeratorGameActions`). Si `game.status === "draft"` e `isOwner`, muestra botón "Publicar" que llama a `publishGame` |
| ModeratorGameActions | `components/ModeratorGameActions.tsx` | Client | `{ game: GameWithDetails }` — botones Aprobar (pendiente), Rechazar (pendiente), Eliminar (aprobado/rechazado) para moderadores en perfiles ajenos |
| ProfileTabs | `components/ProfileTabs.tsx` | Client | `{ games[], badges[], isOwner, isModOrAdmin? }` — tabs "Juegos" (default) y "Logros" (solo si tiene badges). Cuando `isOwner=true`: sub-tabs de filtro (Todos / Publicados / En moderación / Rechazados) con conteo por status, botón "Logros" como toggle. Cuando `isOwner=false`: comportamiento original con tabs Juegos/Logros |
| FollowButton | `components/FollowButton.tsx` | Client | `{ targetUserId, isFollowing }` — botón Seguir/Siguiendo con useActionState |
| GameActionsInline | `components/GameActionsInline.tsx` | Client | `ToggleVisibilityButton(gameId, hidden)` y `DeleteGameButton(gameId)` — wrappers useActionState para evitar inline "use server" en client components |

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
| Rating | `components/Rating.tsx` | Sistema de 5 estrellas |

## Hooks

| Hook | Archivo | Propósito |
|------|---------|-----------|
| use-debounce | `hooks/use-debounce.ts` | Debounce genérico (300ms en SearchBar) |
| use-toast | `hooks/use-toast.ts` | Estado global de toasts |
| useRealtimeNotifications | `hooks/use-realtime-notifications.ts` | Suscripción Realtime a INSERT/UPDATE en `notifications` |

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
| getGameById | `lib/actions/games.ts` | Detalle de juego + tags + ratings |
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
