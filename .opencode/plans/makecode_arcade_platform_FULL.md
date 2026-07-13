# 🎮 MakeCode Arcade Platform — FULL SPEC (Production-Ready Prompt)

## 🧠 Overview

Build a scalable web platform inspired by arcade portals (e.g. juegosdiarios.com) focused exclusively on **MakeCode Arcade games**, allowing users to publish and play games via embedded iframes.

This document defines:
- Architecture
- Database schema
- Business logic
- UI/UX requirements
- API behavior
- Edge cases
- Security rules

Goal: Generate production-ready code with minimal iteration.

---

## ⚙️ Tech Stack

- Next.js (App Router, Server Components)
- TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Storage)
- Vercel (deployment)

---

## 🧩 Core Concepts

### Game Source
Games are NOT uploaded. They are referenced via MakeCode URLs.

Example:
https://arcade.makecode.com/---run?id=_HdY0sobLD4zd

---

## 🔑 Core Rules

- Game ID = MakeCode ID (primary key)
- No duplicate games allowed
- Only approved games are public
- Users can hide their own games
- Anonymous users can play games

---

## 🗄️ Full Database Schema

```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamp default now()
);

-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- games
create table games (
  id text primary key,
  user_id uuid references profiles(id),
  title text not null,
  description text,
  embed_url text not null,
  thumbnail_url text,
  category_id uuid references categories(id),
  status text default 'pending',
  hidden boolean default false,
  created_at timestamp default now(),
  views integer default 0
);

-- tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique
);

-- game_tags
create table game_tags (
  game_id text references games(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (game_id, tag_id)
);

-- ratings
create table ratings (
  id uuid primary key default gen_random_uuid(),
  game_id text references games(id) on delete cascade,
  user_id uuid references profiles(id),
  value integer check (value >= 1 and value <= 5),
  unique (game_id, user_id)
);
```

---

## 🔧 Core Utilities

### Extract ID

```ts
export function extractGameId(url: string): string | null {
  const match = url.match(/id=([a-zA-Z0-9\-_]+)/)
  return match ? match[1] : null
}
```

---

### Build Embed

```ts
export function buildEmbedUrl(id: string) {
  return `https://arcade.makecode.com/---run?id=${id}`
}
```

---

## 🧱 Project Structure

```
/app
  /(public)
    page.tsx
    juego/[id]/page.tsx
    perfil/[username]/page.tsx

  /(protected)
    subir/page.tsx
    dashboard/page.tsx

/components
  GameCard.tsx
  GameGrid.tsx
  ArcadeEmbed.tsx
  Rating.tsx
  SearchBar.tsx
  CategoryFilter.tsx

/lib
  supabaseClient.ts
  game-utils.ts
  queries.ts

/actions
  createGame.ts
  rateGame.ts
  hideGame.ts
```

---

## 🔍 Search Logic

- Title ILIKE
- Tag join
- Paginated results

---

## ⭐ Rating System

- One vote per user
- Update if exists
- Calculate average dynamically

---

## 🔐 Auth Flow

- Microsoft OAuth (Supabase)
- Auto session restore
- Protected routes:
  - /subir
  - /dashboard

---

## 🧪 Edge Cases

- Invalid URL
- Duplicate ID
- Missing ID param
- Game removed externally
- iframe blocked

---

## 🔒 Security

- Validate all inputs server-side
- RLS policies in Supabase:
  - users can only modify own games
  - ratings tied to user_id

---

## 🎨 UI Requirements

- Dense grid layout
- Mobile-first
- Skeleton loading
- Empty states
- Toast feedback

---

## 📈 Performance

- Pagination via LIMIT/OFFSET
- Avoid client overfetching
- Cache static pages when possible

---

## 🚀 Future Extensions (do NOT implement now)

- Trending games
- Leaderboards
- Challenges
- Game analytics
- Screenshot generation

---

## 🎯 Final Goal

Deliver a clean, extensible MVP ready for production deployment with strong foundations for scaling.
