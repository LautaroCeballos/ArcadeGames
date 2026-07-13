---
title: "ArcadePlay — Registro de Cambios del Wiki"
tags: [log]
last_updated: "2026-07-13"
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
