---
title: "ArcadePlay — Flujo de Autenticación"
tags: [auth, feature]
last_updated: "2026-07-13"
sources:
  - docs/raw/plans/makecode_arcade_platform_FULL.md
---

# ArcadePlay — Flujo de Autenticación

## Método

Email/password mediante Supabase Auth.

## Flujo de registro

1. Usuario completa formulario en `/signup` (email + password + username)
2. Server action `signUp` en `lib/actions/auth.ts` llama a `supabase.auth.signUp()`
3. Supabase crea el usuario y dispara el trigger que crea el perfil en `profiles`
4. Se envía email de confirmación (según configuración de Supabase)
5. Usuario confirma email y queda autenticado

## Flujo de inicio de sesión

1. Usuario completa formulario en `/login` (email + password)
2. Server action `signIn` llama a `supabase.auth.signInWithPassword()`
3. Supabase setea cookies de sesión automáticamente
4. Redirección a `/dashboard`

## Flujo de cierre de sesión

1. Server action `signOut` llama a `supabase.auth.signOut()`
2. Se limpian cookies de sesión
3. Redirección a `/`

## Middleware de sesión

`middleware.ts` (basado en `@supabase/ssr`):
- Refresca la sesión automáticamente
- Protege rutas `/subir` y `/dashboard`
- Expone `(session)` en request headers para Server Components

## Server vs Client

- **Server actions** (`lib/actions/auth.ts`): manejan signIn, signUp, signOut usando `createServerClient` de `@supabase/ssr`
- **Client components**: usan `createBrowserClient` de `@supabase/ssr` para escuchar cambios de sesión en tiempo real
- **Server Components**: usan `createServerClient` con cookies del request para leer la sesión actual

## Perfiles

Al registrarse, un trigger en Supabase crea automáticamente el perfil en `profiles`:

```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```
