---
title: "ArcadePlay — Registro de Cambios del Wiki"
tags: [log]
last_updated: "2026-07-20"
---

# ArcadePlay — Registro de Cambios del Wiki

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
