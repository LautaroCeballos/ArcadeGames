-- Create favorites table (users can favorite/bookmark games)
-- Composite PK: (user_id, game_id) — one favorite per user per game

create table if not exists public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  game_id    text not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- Indexes
create index if not exists idx_favorites_user on public.favorites (user_id);
create index if not exists idx_favorites_game on public.favorites (game_id);

-- Enable RLS
alter table public.favorites enable row level security;

-- RLS: anyone can read favorites (counts, lists)
create policy "favorites_select"
  on public.favorites for select
  using (true);

-- RLS: authenticated users can insert their own favorites
create policy "favorites_insert"
  on public.favorites for insert
  with check (auth.uid() = user_id);

-- RLS: authenticated users can delete their own favorites
create policy "favorites_delete"
  on public.favorites for delete
  using (auth.uid() = user_id);
