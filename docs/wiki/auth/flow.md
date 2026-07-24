---
title: "ArcadePlay — Flujo de Autenticación"
tags: [auth, feature]
last_updated: "2026-07-20"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
  - lib/actions/auth.ts
  - lib/actions/profile.ts
  - components/SignUpForm.tsx
  - components/LoginForm.tsx
  - components/AccountForm.tsx
  - components/ChangePasswordForm.tsx
  - supabase/migrations/00008_profiles_email_display_name.sql
---

# ArcadePlay — Flujo de Autenticación

## Método

Email/password mediante Supabase Auth. La verificación por email es obligatoria para activar la cuenta.

## Flujo de registro

1. Usuario completa formulario en `/signup` con:
   - **Email** (validación de formato)
   - **Nombre de usuario** (sanitizado, solo alfanumérico + guión bajo, 3-30 caracteres)
   - **Contraseña** (mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número)
   - **Confirmación de contraseña** (debe coincidir)
   - **Mes y año de nacimiento** (opcional, con validación de rango)
   - **País** (opcional, selector de países ISO 3166-1)
2. Server action `signUp` en `lib/actions/auth.ts` sanitiza y valida todos los campos
3. Llama a `supabase.auth.signUp()` con `options.data` conteniendo `{ username, birth_month, birth_year, country }`
4. Supabase crea el usuario y dispara el trigger que crea el perfil en `profiles`
5. Se envía email de confirmación (configuración de Supabase)
6. El formulario muestra pantalla de éxito con opción de reenviar email
7. Usuario confirma email y puede iniciar sesión

## Reenvío de email de verificación

- Acción `resendVerificationEmail` en `lib/actions/auth.ts`
- Se muestra en la pantalla de éxito post-registro
- El usuario ingresa su email y recibe un nuevo mensaje de confirmación
- Usa `supabase.auth.resend({ type: "signup", email })`

## Flujo de inicio de sesión

1. Usuario completa formulario en `/login` con:
   - **Usuario o email** (acepta username o email)
   - **Contraseña** (con toggle de visibilidad — botón ojito)
2. Server action `signIn` en `lib/actions/auth.ts:158`:
   - Si el input contiene `@` → se usa directamente como email
   - Si no contiene `@` → se busca el username en `profiles` (case-insensitive con `.ilike()`) y se obtiene el email asociado
3. Llama a `supabase.auth.signInWithPassword({ email, password })`
4. Supabase setea cookies de sesión automáticamente
5. Redirección a `/dashboard`

## Flujo de cierre de sesión

1. Server action `signOut` llama a `supabase.auth.signOut()`
2. Se limpian cookies de sesión
3. Redirección a `/`

## Middleware de sesión

`lib/supabase/middleware.ts` (basado en `@supabase/ssr`):
- Refresca la sesión automáticamente
- Protege rutas `/subir` y `/dashboard`
- Expone `(session)` en request headers para Server Components

## Server vs Client

- **Server actions** (`lib/actions/auth.ts`): manejan signIn, signUp, signOut, resendVerificationEmail usando `createServerClient` de `@supabase/ssr`
- **Client components**: usan `createBrowserClient` de `@supabase/ssr` para escuchar cambios de sesión en tiempo real
- **Server Components**: usan `createServerClient` con cookies del request para leer la sesión actual
- **SignUpForm**: usa `useActionState` con dos acciones: `signUp` y `resendVerificationEmail`. Maneja estados de carga, error y éxito con pantalla de verificación

## Seguridad implementada

- **Sanitización de username**: se eliminan espacios, se valida con regex `/^[a-zA-Z0-9_]{3,30}$/`
- **Contraseña robusta**: mínimo 8 caracteres, mayúscula, minúscula y número requeridos
- **Confirmación de contraseña**: se verifica que ambos campos coincidan en el servidor
- **Validación de email**: regex de formato básico
- **Validación de rangos**: birth_month (1-12), birth_year (1900-año actual)

## Perfiles

Al registrarse, un trigger en Supabase crea automáticamente el perfil en `profiles`:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

El trigger actualizado (migración `00008`) usa `raw_user_meta_data->>'username'` si está presente (fallback al email prefix), y almacena el email del usuario en la columna `email` de `profiles`.

## Gestión de cuenta

Hay una página de administración de cuenta en `/cuenta` (ruta protegida) con tres secciones:

### Información del registro
Muestra los datos recolectados al crear la cuenta: username, email, fecha de nacimiento, país y fecha de creación.

### Editar perfil
Panel colapsable (se abre con botón "Editar Perfil") con:
- **Avatar**: subida de imagen a Supabase Storage (bucket `avatars`, 2 MB máx, formatos PNG/JPG/WebP/GIF). Preview antes de guardar.
- **Nombre de usuario**: input uncontrolled con verificación de disponibilidad al salir del campo (`onBlur`). Consulta server action `checkUsername` en `lib/actions/profile.ts`.
- **Biografía**: textarea opcional.
- **Fecha de nacimiento**: mes (select) y año (input numérico).
- **País**: selector ISO 3166-1.
- Server action `updateAccount` en `lib/actions/profile.ts:76` maneja la subida de avatar a Storage y la actualización de datos.

### Cambiar contraseña
Formulario independiente con nueva contraseña + confirmación (ambos con toggle de visibilidad).
Server action `updatePassword` en `lib/actions/profile.ts:138` — validación de fortaleza (8+ chars, mayúscula, minúscula, número) y llama a `supabase.auth.updateUser({ password })`.

### Navbar
Se agregó un ícono de engranaje (`Settings`) en la navbar (desktop y mobile) que enlaza a `/cuenta`.
