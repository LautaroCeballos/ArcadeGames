---
title: "ArcadePlay — Flujo de Autenticación"
tags: [auth, feature]
last_updated: "2026-07-27"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - lib/actions/auth.ts
  - lib/actions/profile.ts
  - lib/supabase/admin.ts
  - components/SignUpForm.tsx
  - components/LoginForm.tsx
  - components/AccountForm.tsx
  - components/ChangePasswordForm.tsx
  - hooks/use-debounce.ts
  - supabase/migrations/00008_profiles_email_display_name.sql
  - supabase/migrations/00007_profiles_birth_country.sql
  - docs/raw/email-templates.md
---

# ArcadePlay — Flujo de Autenticación

## Método

Email/password mediante Supabase Auth. La verificación por email es obligatoria para activar la cuenta, **excepto para usuarios con dominio `@creativos-digitales.com`** que se auto-confirman.

## Flujo de registro

### Validación en tiempo real

El formulario en `/signup` valida campos mientras el usuario escribe (con debounce de 500ms):

| Campo | Validación | Icono |
|-------|-----------|-------|
| Username | Server action `checkUsername` (disponibilidad en DB) | ✓ verde / ✗ rojo / ⏳ spinner |
| Email | Server action `checkEmail` (existencia en Auth vía admin API) | ✓ verde / ✗ rojo / ⏳ spinner |
| Contraseña | Cliente: 8+ chars, mayúscula, minúscula, número | ✓ verde / ✗ rojo |
| Confirmar | Cliente: coincide con contraseña | ✓ verde / ✗ rojo |

### Layout

Formulario en 2 columnas (`sm:grid-cols-2`) en desktop, 1 columna en mobile:
- **Fila 1**: Usuario | Email
- **Fila 2**: Contraseña | Confirmar
- **Fila 3**: Mes, Año, País (3 columnas)
- **Fila 4**: Error + Botón submit

### Auto-confirmación `@creativos-digitales.com`

Los usuarios que se registran con email del dominio `@creativos-digitales.com` no necesitan verificar su email:

1. `signUp` se ejecuta normalmente
2. Se detecta el dominio `@creativos-digitales.com`
3. Se busca al usuario recién creado mediante la API admin de GoTrue (`/auth/v1/admin/users`)
4. Se confirma el email automáticamente con `PUT /auth/v1/admin/users/{id}` con `{ email_confirm: true }`
5. **Requiere**: `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`

### Duplicados

Si el email ya existe, se muestra "Este email ya está registrado. Si es tu cuenta, iniciá sesión." en vez del error técnico de Supabase.

## Server actions de validación

### `checkEmail` (`lib/actions/auth.ts`)

Verifica si un email ya está registrado usando la API admin de GoTrue. Itera páginas de 200 usuarios (máx 5 páginas) comparando case-insensitive. Sin `SUPABASE_SERVICE_ROLE_KEY`, retorna `available: true` como failsafe.

### `checkUsername` (`lib/actions/profile.ts`)

Verifica disponibilidad de username consultando la tabla `profiles` con `.ilike()`. Ya existía previamente.

## Plantillas de email

Los templates HTML para Confirm Signup, Reset Password y Magic Link están documentados en `docs/raw/email-templates.md`. Usan diseño responsive con gradiente azul-violeta, botones estilizados y mejor legibilidad. Se configuran en Supabase Dashboard > Authentication > Email Templates.
