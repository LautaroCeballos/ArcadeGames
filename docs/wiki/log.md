---
title: "ArcadePlay — Registro de Cambios del Wiki"
tags: [log]
last_updated: "2026-07-23"
sources:
  - supabase/migrations/00015_enable_realtime_notifications.sql
  - hooks/use-realtime-notifications.ts
  - components/NavbarClient.tsx
  - docs/wiki/features/notifications.md
  - lib/actions/auth.ts
  - lib/actions/profile.ts
  - lib/actions/social.ts
  - lib/actions/search.ts
  - components/SignUpForm.tsx
  - components/LoginForm.tsx
  - components/AccountForm.tsx
  - components/FollowButton.tsx
  - supabase/migrations/00007_profiles_birth_country.sql
  - supabase/migrations/00008_profiles_email_display_name.sql
  - supabase/migrations/00009_avatars_storage.sql
  - docs/raw/plans/2026-07-23-header-redesign-search.md
  - docs/raw/plans/2026-07-23-live-search-dropdown.md
  - app/(public)/buscar/page.tsx
---

# ArcadePlay — Registro de Cambios del Wiki

## [2026-07-23] implement | live-search-dropdown
- Input de búsqueda ahora muestra dropdown en tiempo real tras 500ms de debounce
- `components/NavbarClient.tsx`: debounce effect con flag `cancelled` para evitar race conditions, dropdown con secciones Juegos (thumbnail + título + autor), Usuarios (avatar + username), Categorías (pills), loading state, empty state, footer "Ver todos los resultados"
- Cierra con Escape, click fuera, navegación
- Enter sigue navegando a `/buscar?q=...`
- Plan: `docs/raw/plans/2026-07-23-live-search-dropdown.md`
- Páginas actualizadas: [[log]]

## [2026-07-23] implement | header-redesign-multi-search
- Rediseño completo del header: iconos homogéneos, avatar con dropdown unificado, search input funcional
- `components/Navbar.tsx`: agregado fetch de `avatar_url` desde profiles
- `components/NavbarClient.tsx`: reemplazado icono Search por input que navega a `/buscar?q=...`; avatar + dropdown reemplaza User/Settings/Moderar/Admin/Cerrar sesión individuales; iconos consistentes (`variant="ghost"` beige sobre rojo)
- `lib/actions/search.ts`: nueva server action `searchAll` — búsqueda multi-entidad con ILIKE en games, profiles y tags (3 queries paralelas, límite 8 por entidad)
- `app/(public)/buscar/page.tsx`: nueva ruta de resultados con grid 3-columnas (Juegos, Usuarios, Categorías), empty state, contador de resultados
- Plan: `docs/raw/plans/2026-07-23-header-redesign-search.md`
- Páginas actualizadas: [[frontend/components]], [[architecture/routes]], [[log]]

## [2026-07-23] debug | verify-realtime-notifications-end-to-end
- **Propósito**: Verificar si el Realtime de notificaciones funciona end-to-end (server action → RPC → INSERT → Realtime → browser)
- **Prueba 1**: Direct INSERT via SQL → evento Realtime recibido ✅
- **Prueba 2**: `SELECT create_notification(...)` via SQL (RPC function) → evento Realtime recibido ✅
- **Prueba 3**: Click "Seguir" en perfil de Creativos_Digitales → server action `followUser` → `createNotification` → RPC → INSERT → evento Realtime recibido ✅
- **Teoría descartada**: `SECURITY DEFINER` NO bloquea la entrega de eventos Realtime. La función RPC inserta en `notifications` y el cambio se replica correctamente vía WAL → Realtime → browser.
- **Nuevo hallazgo**: La función `create_notification` carece de `set search_path` explícito, lo que es un riesgo de seguridad. Documentado como gotcha.
- **Conclusión**: El sistema de notificaciones Realtime funciona correctamente en todos los escenarios probados.
- Páginas actualizadas: [[features/notifications]], [[log]]

## [2026-07-23] ingest | debugging-notifications-realtime-not-delivered
- **Fuente**: `docs/raw/debugging/2026-07-23-notifications-realtime-not-delivered.md`
- Integración del informe de debugging sobre notificaciones Realtime no entregadas
- **Nuevo escenario documentado**: La tabla `notifications` puede ser removida de la publicación `supabase_realtime` incluso después de haber sido agregada por migración — posiblemente por reset en Supabase Dashboard al agregar/modificar otras tablas Realtime
- Páginas actualizadas: [[features/notifications]], [[log]]

## [2026-07-23] fix | notifications-realtime-publication
- **Diagnóstico**: La migración `00014_notifications.sql` no incluye `alter publication supabase_realtime add table notifications;`, por lo que Supabase Realtime nunca replica cambios de la tabla `notifications`. Tanto el hook en NavbarClient como la suscripción inline en `/notificaciones` reciben 0 eventos.
- **Síntoma reportado**: Las notificaciones no llegan en tiempo real al header (campanita). En `/notificaciones` el usuario cree que funciona, pero solo se debe al fetch inicial — las nuevas no aparecen sin recargar.
- **Fix**: Migración `00015_enable_realtime_notifications.sql` con el `alter publication`.
- **Ubicación**: `supabase/migrations/00015_enable_realtime_notifications.sql`
- **Gotcha documentado**: En `[[features/notifications]]` — prevenir futuras tablas Realtime sin publicación.
- Páginas actualizadas: [[features/notifications]], [[log]]

## [2026-07-23] implement | realtime-follow-counts
- Implementación de Supabase Realtime para contadores de seguidores/siguiendo en vivo en perfiles
- Migración `00016_enable_realtime_follows.sql`: agrega tabla `follows` a publicación `supabase_realtime`
- Nuevo hook `hooks/use-realtime-follow-counts.ts`: suscripción a INSERT/DELETE en `follows` filtrado por `following_id=eq.profileUserId`, incrementa/decrementa contador
- Nuevo componente `components/ProfileStats.tsx`: Client Component con grilla de stats + hook Realtime
- `components/ProfileHeader.tsx`: reemplazada grilla inline por `ProfileStats`
- Patrón consistente con `useRealtimeNotifications`: `didInit.current` para initial data solo en mount
- Build verificado: 0 errores
- Páginas actualizadas: [[features/social]], [[log]]

## [2026-07-23] debug | notifications-realtime-not-delivered
- **Bug**: Después de agregar Realtime a `follows`, las notificaciones dejaron de llegar en tiempo real al Navbar
- **Diagnóstico**: `createNotification` RPC funciona (server log: "Success"), pero el evento INSERT de Realtime nunca llega al browser. Ambos canales muestran SUBSCRIBED. El canal `follows` recibe eventos correctamente; el de `notifications` no.
- **Causa probable**: Supabase Realtime no está entregando eventos de la tabla `notifications` (posible remoción de la publicación o glitch del servicio)
- **Próximo paso**: Verificar en Supabase Dashboard si `notifications` sigue en `supabase_realtime` publication
- Informe completo: `docs/raw/debugging/2026-07-23-notifications-realtime-not-delivered.md`
- Páginas actualizadas: [[log]]

## [2026-07-23] fix | notifications-realtime-initial-data-reset
- **Diagnóstico**: La publicación Realtime **ya existía** (error "relation notifications is already member of publication supabase_realtime"). El hook y la suscripción inline en `/notificaciones` **sí recibían** eventos Realtime correctamente. El problema real era que el hook `useRealtimeNotifications` sobreescribía el estado Realtime con datos del servidor en cada re-render del Server Component Navbar.
- **Causa raíz**: `Navbar.tsx` (Server Component en layout) re-renderiza en cada navegación del cliente → pasa nuevos props `initial` → el `useEffect([initial])` del hook ejecutaba `setNotifications(initial.notifications)` y `setUnreadCount(initial.unreadCount)` → el estado que Realtime acababa de actualizar se perdía.
- **Síntoma verificado**: `/notificaciones` page recibe INSERT en vivo (funciona). Navbar badge muestra 0/valor stale (no funciona).
- **Fix**: Reemplazado `useEffect([initial])` con `didInit.current` flag — solo aplica datos del servidor en el primer montaje. Los renders subsecuentes se ignoran.
- **Archivos modificados**: `hooks/use-realtime-notifications.ts`, `app/(protected)/notificaciones/page.tsx`
- **Cleanup**: Eliminados todos los `console.log` de debug de ambos archivos.
- **Gotcha documentado**: En `[[features/notifications]]` — Server Components en layout + Realtime hooks requieren initial data solo en mount.
- Páginas actualizadas: [[features/notifications]], [[log]]

## [2026-07-23] implement | notifications-realtime
- Implementación de Supabase Realtime para delivery instantáneo de notificaciones
- Hook creado: `hooks/use-realtime-notifications.ts` — suscripción a INSERT + UPDATE con cleanup automático
- `components/Navbar.tsx`: agregado `currentUserId` prop a NavbarClient
- `components/NavbarClient.tsx`: integrado hook Realtime para badge + dropdown en vivo; eliminados useEffects duplicados (scroll y route change)
- `app/(protected)/notificaciones/page.tsx`: agregada suscripción Realtime inline para lista y UPDATE en vivo
- Build exitoso (0 errores TypeScript)
- Páginas actualizadas: [[features/notifications]], [[log]]

## [2026-07-23] implement | notification-system
- Implementación completa del sistema de notificaciones: 5 tipos, tabla + RLS + función SECURITY DEFINER
- Server actions: getUnreadCount, getNotifications, getRecentNotifications, markAsRead, markAllAsRead
- Helper interno createNotification en lib/notifications.ts (llama a supabase.rpc)
- Puntos de inserción: approveGame (dueño + fan-out), rejectGame, rateGame, followUser
- Navbar: Bell icon con badge + dropdown con últimas 5 notificaciones
- Página /notificaciones con paginación, markAsRead, markAllAsRead
- Build exitoso (0 errores TypeScript)
- Páginas creadas: [[features/notifications]]
- Páginas actualizadas: [[database/schema]], [[frontend/components]], [[architecture/routes]], [[index]], [[log]]

## [2026-07-23] plan | notification-system
- Plan completo para sistema de notificaciones: 5 tipos (game_approved, game_rejected, new_game_from_following, new_rating, new_follower)
- Tabla `notifications` con RLS, server actions, dropdown en Navbar + página `/notificaciones`
- 4 puntos de inserción: approveGame (dueño + fan-out), rejectGame, rateGame, followUser
- Plan guardado en `docs/raw/plans/2026-07-23-notification-system.md`
- Páginas actualizadas: [[log]]

## [2026-07-20] implement | header-link-directo-perfil
- `components/Navbar.tsx`: ahora fetchea `username` desde profiles y lo pasa a `NavbarClient`
- `components/NavbarClient.tsx`: ícono User linkea directo a `/perfil/{username}` en vez de `/dashboard`. Fallback a `/dashboard` si no hay username
- NavbarClient: label cambiado de "Dashboard" a "Perfil" tanto desktop como mobile
- Páginas actualizadas: [[frontend/components]]

## [2026-07-20] implement | registro-higienizado-seguro
- Migración `00007_profiles_birth_country.sql` ejecutada en Supabase
- Nuevas columnas en profiles: `birth_month` (CHECK 1-12), `birth_year` (CHECK 1900-{current}), `country` (text)
- `lib/actions/auth.ts`: sanitización de username (regex), validación de password (mayúscula+minúscula+número, min 8), confirmación de contraseña, validación de email, validación de rangos. Nueva acción `resendVerificationEmail`
- `components/SignUpForm.tsx`: refactor completo — campos username (sanitizado), email, password + confirmación (con toggle visibilidad con Eye/EyeOff), mes/año nacimiento (Select + Input), país (selector con lista completa ISO), pantalla de éxito post-registro con reenvío de email
- `app/(public)/signup/page.tsx`: detección de sesión activa (redirige a dashboard)
- `lib/definitions.ts`: agregados `birth_month`, `birth_year`, `country` a `Profile`
- Páginas actualizadas: [[auth/flow]], [[database/schema]], [[frontend/components]], [[log]]

## [2026-07-13] update | implementacion-fase-0-7
- Checkpoint: implementación completa de Fases 0 a 7
- Archivos creados: ~40 archivos (app/, components/, lib/, hooks/, middleware)
- Pendiente: ejecutar migración SQL en Supabase y verificar build
- Nuevo documento: [[project-state]] — estado completo del proyecto

## [2026-07-13] update | build-verificado
- Build verificado: exitoso (0 errores TS, 7 rutas generadas)
- Páginas actualizadas: [[project-state]]
- Pendiente: ejecutar migración SQL en Supabase

## [2026-07-13] ingest | plan-inicial
- Fuente: `docs/raw/plans/makecode_arcade_platform_FULL.md`
- Páginas creadas: [[overview]], [[stack]], [[architecture/routes]], [[database/schema]], [[auth/flow]], [[features/games]]
- Cambios vs plan original: auth Microsoft OAuth → email/password

## [2026-07-13] update | paginacion-preview-autoapprove
- Paginación "Cargar más" en home (`components/LoadMoreGames.tsx`)
- Preview del embed en formulario de subida (`SubmitGameForm.tsx`)
- Auto-approve: status `pending` → `approved` al crear juego
- Build verificado: 0 errores

## [2026-07-13] update | migracion-sql-ejecutada
- Migración `00001_initial_schema.sql` ejecutada vía MCP Supabase
- 6 tablas creadas, 10 categorías seeded, RLS activo

## [2026-07-13] update | github-vercel
- Repo conectado: `github.com/LautaroCeballos/ArcadeGames`
- Primer commit + push a master

## [2026-07-13] update | url-formats-accesibilidad
- Nuevos formatos de URL aceptados: `makecode.com/_...` y `arcade.makecode.com/...` (path)
- `extractGameId` y `isValidMakeCodeUrl` refactorizados con `URL` parser
- Formulario de subida: `fieldset`/`legend`, `aria-*`, `role="alert"`, validación inline
- proxy.ts: export corregido de `middleware` a `proxy`

## [2026-07-13] update | proxy-migration
- `middleware.ts` → `proxy.ts` (Next.js 16 breaking change)
- Export renombrado: `middleware` → `proxy`

## [2026-07-13] ingest | figma-adaptation
- Fuente: `docs/raw/plans/2026-07-13-figma-adaptation.md`
- Páginas creadas: [[frontend/design-tokens]], [[frontend/components]]
- Páginas actualizadas: [[stack]], [[overview]], [[project-state]], [[index]]
- Cambios: documentación del diseño Figma (paleta rojo/verde/beige), inventario de componentes frontend, plan de adaptación visual

## [2026-07-13] implement | figma-adaptation-10-fases
- Implementación completa de las 10 fases del plan `docs/raw/plans/2026-07-13-figma-adaptation.md`
- Build verificado: 0 errores TypeScript, todas las rutas generadas
- **Fase 1** — `globals.css`: paleta arcade (red/green/beige), dark mode, @theme inline con tokens `arcade-*`
- **Fase 2** — `components/Navbar.tsx` + `NavbarClient.tsx`: navbar roja con íconos lucide-react, scroll shadow, menú hamburguesa mobile
- **Fase 3** — `components/Footer.tsx`: footer rojo con 2 columnas de links, reemplazado en `layout.tsx`
- **Fase 4** — `lib/actions/games.ts`: `getRecentGames()`, `getMostPlayed()`, `getTopRated()` + tipo `GameThumbnailData`
- **Fase 5** — `GameThumbnail.tsx`, `CuratedSection.tsx`, `GameCard.tsx`: thumbnails con overlay oscuro, scroll horizontal snap, skeletones
- **Fase 6** — `app/(public)/page.tsx`: homepage rediseñada con HeroSlider + 3 secciones curadas + ranking + grilla completa
- **Fase 7** — `components/HeroSlider.tsx`: auto-play 5s, dots, pausa en hover, mock data
- **Fase 8** — `RankingSection.tsx` + `PodiumCard.tsx`: 4 cards de período + podio decorativo
- **Fase 9** — `app/(public)/juego/[id]/page.tsx`: badges rojos, colores arcade, estilo consistente
- **Fase 10** — Build verificado (compiled successfully, 0 errors)
- Páginas actualizadas: [[project-state]], [[frontend/components]]

## [2026-07-14] update | thumbnail-picker-capura-en-vivo

- Nuevo `components/ThumbnailPicker.tsx`: selector de miniatura con 3 fuentes:
  1. **Captura en vivo** — usa `navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true })` para capturar el frame exacto que el usuario ve en la preview. Sube a Supabase Storage automáticamente.
  2. **MakeCode oficial** — fetch a `api/{shortId}` + `cdn.makecode.com/api/{longId}/thumb`
  3. **Subida manual** — file input → upload a Supabase Storage
- Grid de thumbnails seleccionables con check "Usar esta", botón X para quitar
- Nuevo bucket Supabase Storage `game-thumbnails` (público, RLS por user_id)
- Nuevo server action `lib/actions/thumbnails.ts:uploadThumbnail()` — valida tipo/tamaño, sube a storage
- `lib/game-utils.ts:fetchProjectThumbnailUrl()` — fetch a API pública de MakeCode
- `createGame` actualizado para guardar `thumbnail_url` desde el form
- Build verificado: 0 errores
- Páginas actualizadas: [[frontend/components]], [[database/schema]]

## [2026-07-14] implement | perfil-rediseno-badges-follows

- **Migración**: `00002_profiles_badges_follows.sql` — tablas `badges`, `user_badges`, `follows`; columnas `bio`, `website` en profiles; 8 badges seedeados; RLS completa
- **Server actions**: `profile.ts` (getProfileByUsername con stats computadas, updateMyProfile), `social.ts` (followUser, unfollowUser, isFollowing, getFollowers, getFollowing), `badges.ts` (checkAndAwardBadges, getAllBadges)
- **Componentes**: ProfileHeader (avatar, username, bio, website, stats bar, follow button), ProfileBadges (grid con hover tooltip), ProfileGameCard (card con thumbnail + status + acciones si es dueño), ProfileTabs (tabs Juegos/Logros), FollowButton, GameActionsInline
- **Perfil**: página `/perfil/[username]` rediseñada con header + stats + tabs + gestión de juegos (editar, ocultar, eliminar si es dueño)
- **Dashboard**: `/dashboard` redirige a `/perfil/{username}`
- **Badges**: se asignan automáticamente al crear juego (`createGame`) y al votar (`rateGame`)
- `lib/utils.ts`: nuevo helper `formatCount()`
- Build verificado: 0 errores TS, 9 rutas (dashboard redirige dinámicamente)

## [2026-07-14] fix | button-anidado-thumbnailpicker
- Fix: `<button>` anidado dentro de `<button>` en ThumbnailPicker → el contenedor pasa a `<div role="button">`
- Causa: hydration error por HTML inválido (button descendant of button)
- Build verificado: 0 errores

## [2026-07-14] update | dashboard-rediseno-editar-juegos

- Dashboard (`/dashboard`) rediseñado: stats bar (total, publicados, pendientes, vistas) + grid de `DashboardCard` con thumbnail, estado, acciones
- Nuevo `components/DashboardCard.tsx`: card horizontal con status badges (Publicado/Oculto/En moderación/Rechazado), métricas, acciones (jugar, editar, ocultar, eliminar)
- Nuevo server action `updateGame` en `lib/actions/games.ts:93` — edita título, descripción, categoría, miniatura
- Nueva ruta `/editar/[id]` con `EditGameForm`: formulario pre-cargado con preview + ThumbnailPicker
- Estado vacío mejorado con icono, mensaje y CTA
- Build verificado: 0 errores
- Páginas creadas: —
- Páginas actualizadas: [[frontend/components]], [[architecture/routes]], [[features/games]]

## [2026-07-14] update | game-tabs-juego-editor

- Nuevo `components/GameTabs.tsx`: tabs Juego (default) + Editor debajo del embed
- `components/ArcadeEmbed.tsx`: nuevo prop `sandbox?` para el iframe
- `app/(public)/juego/[id]/page.tsx`: reemplazado ArcadeEmbed por GameTabs
- ThumbnailPicker simplificado: eliminado `getDisplayMedia` (rechazado por el usuario), solo auto MakeCode + subida manual
- Build verificado: 0 errores
- Páginas actualizadas: [[frontend/components]], [[features/games]]

## [2026-07-20] ingest | submit-form-dual-platform
- Fuente: `docs/raw/plans/2026-07-20-submit-form-dual-platform.md`
- Páginas actualizadas: [[features/games]], [[database/schema]], [[frontend/components]], [[overview]], [[project-state]]
- Cambios: documentación del soporte dual MakeCode + Scratch, nueva columna `platform` en `games`, nuevo componente `ScratchEmbed`, actualización de `SubmitGameForm`, `GameTabs`, `EditGameForm`, funciones en `game-utils.ts`

## [2026-07-20] implement | submit-form-dual-platform
- Implementación completa del formulario dual (MakeCode + Scratch) según plan `docs/raw/plans/2026-07-20-submit-form-dual-platform.md`
- **Fase 1** — `lib/game-utils.ts`: `extractScratchId`, `buildScratchEmbedUrl`, `isValidScratchUrl`, `extractGamePlatform`. `lib/definitions.ts`: `platform` en interface `Game`
- **Fase 2** — `components/ScratchEmbed.tsx`: nuevo embed con `allowtransparency`, aspect 485/402. `components/GameTabs.tsx`: adaptativo por plataforma
- **Fase 3** — `components/SubmitGameForm.tsx`: rediseño completo con toggle MakeCode/Scratch, validación dual, preview condicional, campos compartidos. `components/ThumbnailPicker.tsx`: prop `platform` para saltar auto-fetch en Scratch
- **Fase 4** — `lib/actions/games.ts`: `createGame` con validación dual. Páginas: `subir/page.tsx` (copy), `juego/[id]/page.tsx` (badge plataforma + platform a GameTabs), `editar/[id]/page.tsx` (platform a EditGameForm). `components/EditGameForm.tsx`: preview según platform
- Build verificado: 0 errores TS, 8 rutas
- Páginas actualizadas: [[project-state]], [[overview]], [[frontend/components]], [[log]]

## [2026-07-20] db | migraciones-supabase
- Ejecutada migración `00003_add_platform` en Supabase: columna `platform` en `games` con CHECK constraint e índice. 7 juegos existentes migrados con `'makecode'`
- Ejecutada migración `00004_revoke_public_execute`: revocado EXECUTE de `PUBLIC` en funciones `handle_new_user`, `award_badge`, `recalc_owner_stars` (seguridad)
- Verificado: trigger `on_auth_user_created` existe y funciona (1 perfil creado automáticamente)
- Páginas actualizadas: [[project-state]]

## [2026-07-20] implement | submit-form-tags-redesign
- Implementación completa del rediseño del formulario de subida con tags + layout 2 columnas
- DB: migración 00005 ejecutada — 12 tags seeded, 16 game_tags migrados, category_id dropeada
- Definitions: removido `category_id` de Game, removido `categories` de GameWithDetails
- Actions: createGame/updateGame aceptan tag_ids, insert/reemplazan game_tags; getGames filtra por tagIds; todas las queries sin categories(*)
- TagPicker: nuevo componente visual, 8 colores rotativos, locked tag, multiselect
- SubmitGameForm: Step 1 (selector plataforma con cards visuales) + Step 2 (2 columnas, TagPicker, ThumbnailPicker condicional)
- EditGameForm: TagPicker reemplaza Select categoría, tags precargadas, platform tag locked
- Páginas: subir (fetch tags), editar (fetch tags + game_tags), juego/[id] (tags como badges, related por tag), perfil (tags adjuntos)
- Homepage: TagFilter reemplaza CategoryFilter, URL param `?tag=`, filtro funcional
- Build 0 errores TS, validación chrome-devtools exitosa (homepage, juego/[id], filtro tags, mobile responsive)
- Páginas actualizadas en wiki: [[project-state]], [[frontend/components]], [[database/schema]], [[log]]

## [2026-07-20] ingest | submit-form-tags-redesign-plan
- Fuente: `docs/raw/plans/2026-07-20-submit-form-tags-redesign.md`
- Nuevo plan: rediseño completo del formulario de subida
  - Step 1: selector visual de plataforma (MakeCode/Scratch)
  - Step 2: formulario 2 columnas (preview izquierda, inputs derecha)
  - Tags reemplazan categorías (migración DB + TagPicker visual)
  - Interfaz child-friendly con burbujas coloridas
- Páginas actualizadas: [[features/games]], [[frontend/components]], [[database/schema]], [[overview]], [[project-state]], [[log]]

## [2026-07-20] update | subir-layout-columnas- footer-unificado
- Subir page: `max-w-7xl` para ancho consistente con header
- Columnas intercambiadas: inputs izquierda, preview derecha sticky
- ThumbnailPicker siempre visible, sin fieldset wrapper (usa título interno "Miniatura del juego")
- Footer unificado: protected layout ahora usa el mismo `Footer` component que el layout público
- Archivos modificados: `app/(protected)/subir/page.tsx`, `components/SubmitGameForm.tsx`, `app/(protected)/layout.tsx`
- Páginas actualizadas: [[frontend/components]], [[features/games]]
- Build verificado: 0 errores

## [2026-07-20] update | ranking-conectado-rediseno
- Ranking real conectado a DB: `getPlayerLeaderboard()` suma ratings recibidos por dueño de juego
- Rediseño completo: podio destacado (2°|1°|3°) + lista #4-#50 limpia sin fondos verdes
- Estilo alineado al resto del sitio: título `text-[25px] font-semibold`, cards `bg-card border shadow-sm`
- Archivos creados: `lib/actions/ranking.ts`
- Archivos modificados: `components/RankingSection.tsx`, `components/PodiumCard.tsx`, `app/(public)/page.tsx`, `lib/definitions.ts`
- Build verificado: 0 errores
- Pendiente eliminado de [[project-state]]: ranking mock reemplazado ✅
- Páginas actualizadas: [[project-state]], [[frontend/components]], [[log]]

## [2026-07-20] implement | login-username-cuenta
- Login ahora acepta username o email (campo "Usuario o email", búsqueda case-insensitive en profiles)
- LoginForm: toggle de visibilidad en contraseña (Eye/EyeOff)
- Trigger `handle_new_user` actualizado: usa `raw_user_meta_data->>'username'` y almacena email
- Nueva columna `email` en profiles (backfilled desde `auth.users`)
- Bucket `avatars` en Supabase Storage (2 MB, PNG/JPG/WebP/GIF)
- Nueva página `/cuenta`: info del registro, editar perfil colapsable (avatar upload, username checker onBlur, bio, fecha, país), cambio de contraseña
- Nuevos server actions: `updateAccount`, `updatePassword`, `checkUsername`
- Nuevos componentes: `AccountForm`, `ChangePasswordForm`, `Textarea`
- Navbar: agregado ícono Settings enlace a /cuenta
- Páginas actualizadas: [[auth/flow]], [[database/schema]], [[frontend/components]], [[architecture/routes]], [[project-state]], [[log]]

## [2026-07-20] update | cuenta-info-unificada
- Card "Información del registro" + Card "Editar perfil" fusionadas en un solo Card "Información"
- `AccountForm` refactorizado: nueva vista información con avatar (siempre visible), username, email, bio, fecha, país, creada — y botón "Editar perfil" en header que reemplaza el contenido por el formulario inline
- `app/(protected)/cuenta/page.tsx`: simplificado — eliminados imports y cards redundantes, solo `AccountForm` + `ChangePasswordForm`
- País ahora muestra nombre legible (ej. "Argentina") en vez de código ISO ("AR")
- Build verificado: 0 errores TS
- Páginas actualizadas: [[frontend/components]], [[log]]

## [2026-07-20] implement | sistema-moderacion-roles
- Migración `00010_moderator_role.sql`: columna `role` en profiles (user/moderator/admin), RLS para moderadores (SELECT/UPDATE/DELETE en cualquier juego)
- Types: `UserRole` y `role` en interface `Profile`
- Server actions: `getPendingGames`, `getModeratedGames`, `approveGame`, `rejectGame`, `modToggleVisibility`, `modDeleteGame`, `getUsers`, `setUserRole`
- `createGame` ahora crea juegos con `status: 'pending'` en vez de `'approved'`
- Nuevo dashboard de moderación `/moderar` con tabs y CRUD completo
- Nueva página admin `/admin/usuarios` con tabla + selector de roles
- Navbar: links condicionales "Moderar" (moderator/admin) y "Admin" (solo admin)
- ProfileGameCard: moderadores ven todos los juegos + botones de acción (aprobación/rechazo/eliminación)
- Nuevo componente `ModeratorGameActions` para acciones rápidas en perfil ajeno
- Páginas actualizadas: [[features/moderacion]], [[database/schema]], [[features/games]], [[frontend/components]], [[architecture/routes]], [[index]], [[log]]

## [2026-07-21] update | draft-status-publicacion-opcional
- Migración `00013_draft_status.sql`: agrega `draft` al CHECK constraint de `games.status`
- `lib/actions/games.ts`: `createGame` lee `action` del form ("draft"/"publish") para decidir status, nueva `publishGame()` para enviar borrador a moderación, `updateGame` preserva drafts
- `components/SubmitGameForm.tsx`: dos botones submit "Publicar" y "Guardar borrador"
- `components/ProfileGameCard.tsx`: badge "Borrador", botón "Publicar" para drafts dueño
- `components/DashboardCard.tsx`: badge "Borrador", botón "Publicar" para drafts
- `components/ProfileTabs.tsx`: filtro "Borradores" en sub-tabs del dueño
- `lib/definitions.ts`: `Game.status` cambia de `string` a `'draft' | 'pending' | 'approved' | 'rejected'`

## [2026-07-21] update | moderacion-rechazo-motivo-revertir
- Migración `00011_rejection_reason.sql`: columna `rejection_reason` en `games`
- `lib/actions/games.ts`: `rejectGame` ahora acepta `reason?` opcional, nueva acción `revertToPending`
- `app/(protected)/moderar/moderator-dashboard.tsx`: botón "Volver a pendiente" en juegos aprobados, diálogo modal para motivo de rechazo al hacer clic en "Rechazar", muestra `rejection_reason` en cards rechazadas
- `components/ProfileGameCard.tsx`: muestra motivo de rechazo al desarrollador en su perfil
- `components/ProfileTabs.tsx`: sub-tabs de filtro por status (Todos/Publicados/En moderación/Rechazados) cuando `isOwner=true`, botón Logros como toggle
- Páginas actualizadas: [[features/moderacion]], [[database/schema]], [[frontend/components]], [[log]]

## [2026-07-23] implement | admin-banner-content
- Implementación completa del sistema de administración de banner del home
- Migración `00017_banner_slides.sql`: tabla `banner_slides` + RLS + storage bucket `banners`
- Server actions en `lib/actions/banner.ts`: CRUD + reorder + upload de imágenes
- Admin panel en `/admin/banner`: listado, creación, edición, eliminación, reorden de slides
- HeroSlider actualizado para leer desde DB con fallback a defaults
- Links en NavbarClient (desktop + mobile) para acceso rápido
- Plan: `docs/raw/plans/2026-07-23-admin-banner-content.md`
- Páginas creadas: [[features/banner]]
- Páginas actualizadas: [[frontend/components]], [[database/schema]], [[architecture/routes]], [[index]], [[log]]

## [2026-07-23] plan | supabase-client-pattern
- Auditoría completa: **58 llamadas a `createClient()` en 21 archivos**, ~15 redundantes
- Causa: helpers internos crean su propio cliente (`revalidateProfilePage`, `getUserRole/assertModerator`)
- Plan: `React.cache()` en `lib/supabase/server.ts` para deduplicar por request, documentar singleton en browser
- Plan movido a `docs/raw/plans/2026-07-23-supabase-client-pattern.md`
- Páginas actualizadas: [[index]], [[log]]

## [2026-07-23] fix | followlist-no-mostrar-boton-propio
- `components/FollowList.tsx`: nuevo prop `currentUserId` — oculta `FollowButton` cuando `currentUserId === user.id` (no te puedes seguir a ti mismo)
- `app/(public)/perfil/[username]/seguidores/page.tsx` y `siguiendo/page.tsx`: pasan `currentUserId={user?.id}`
- Páginas actualizadas: [[features/social]], [[log]]

## [2026-07-23] fix | select-id-inexistente-en-contadores-y-isFollowing
- `lib/actions/profile.ts`: `followersResult` y `followingResult` también usaban `select("id", { count: "exact", head: true })` en tabla sin columna `id` → 400 Bad Request → contadores siempre en 0. Cambiado a `select("follower_id", ...)`.
- Mismo bug raíz que `isFollowing`: la tabla `follows` tiene PK compuesta, no existe columna `id`.
- Páginas actualizadas: [[features/social]], [[log]]

## [2026-07-23] fix | isFollowing-select-id-inexistente
- `lib/actions/social.ts`: `isFollowing()` usaba `select("id")` pero la tabla `follows` NO tiene columna `id` (PK compuesta `(follower_id, following_id)`). Cambiado a `select("follower_id")` + manejo de error.
- Bug raíz: `isFollowing` siempre devolvía `false` → botón siempre mostraba "Seguir" aunque ya se siguiera al usuario → al hacer clic intentaba INSERT duplicado → error "Ya sigues a este usuario".
- También se agregó manejo de error con `console.error` para que futuros bugs de query sean visibles.
- Páginas actualizadas: [[features/social]], [[log]]

## [2026-07-21] fix | follow-system-reparado
- `lib/actions/social.ts`: agregado `refresh()` de `next/cache` en `followUser`/`unfollowUser` para refrescar el router del cliente
- `lib/actions/social.ts`: `revalidateProfilePage` ahora también revalida `/perfil/[username]/seguidores` y `/perfil/[username]/siguiendo`
- `components/FollowButton.tsx`: refactorizado de wrapper cliente (`handleSubmit` + `router.refresh()`) a `useActionState` con server action directo `toggleFollow`
- Patrón: Server action directo al form → React 19 maneja estado pending/error/success → `refresh()` en servidor garantiza que el Server Component se re-renderice
- Páginas creadas: [[features/social]]
- Páginas actualizadas: [[index]], [[log]]

## [2026-07-14] update | ranking-section-rediseno

- Rediseño completo de `RankingSection.tsx` y `PodiumCard.tsx` para alinearse al diseño Figma
- Layout: Fila 1 (Ayer | Podio | Semana), Fila 2 (Mes doble | Año doble)
- Cards con `bg-arcade-green` sólido (corregido de `/80`), `shadow` suave
- Player rows: avatar `size-11 sm:size-12`, nombre `text-arcade-beige`, score `text-arcade-red` + `Star` amarilla
- PodiumCard: top 3 global con trofeos color oro/plata/bronce, mismo formato visual que ranking cards
- Podio SVG fallido → reemplazado por variante CSS unificada con las ranking cards
- Contraste mejorado: fondos sólidos, tipografía `text-base sm:text-lg`
- Build verificado: 0 errores
- Páginas actualizadas: [[frontend/components]], [[frontend/design-tokens]], [[project-state]]
