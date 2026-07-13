-- Enable pg_trgm for search
create extension if not exists pg_trgm;

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamp default now()
);

-- categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- games
create table if not exists games (
  id text primary key,
  user_id uuid references profiles(id),
  title text not null,
  description text,
  embed_url text not null,
  thumbnail_url text,
  category_id uuid references categories(id),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  hidden boolean default false,
  created_at timestamp default now(),
  views integer default 0
);

-- tags
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text unique
);

-- game_tags
create table if not exists game_tags (
  game_id text references games(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (game_id, tag_id)
);

-- ratings
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  game_id text references games(id) on delete cascade,
  user_id uuid references profiles(id),
  value integer check (value >= 1 and value <= 5),
  unique (game_id, user_id)
);

-- Indexes
create index if not exists idx_games_status_hidden on games (status, hidden);
create index if not exists idx_games_user_id on games (user_id);
create index if not exists idx_ratings_game_id on ratings (game_id);
create index if not exists idx_games_title_trgm on games using gin (title gin_trgm_ops);
create index if not exists idx_game_tags_game_id on game_tags (game_id);
create index if not exists idx_game_tags_tag_id on game_tags (tag_id);

-- Trigger: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table games enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table game_tags enable row level security;
alter table ratings enable row level security;

-- Profiles: public read, own insert/update
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles
  for select using (true);

drop policy if exists "profiles_insert" on profiles;
create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update" on profiles;
create policy "profiles_update" on profiles
  for update using (auth.uid() = id);

-- Categories: public read
drop policy if exists "categories_select" on categories;
create policy "categories_select" on categories
  for select using (true);

-- Tags: public read
drop policy if exists "tags_select" on tags;
create policy "tags_select" on tags
  for select using (true);

-- Games: public read approved+visible, insert own, update/delete own
drop policy if exists "games_select" on games;
create policy "games_select" on games
  for select using (
    (status = 'approved' and hidden = false) or
    (auth.uid() = user_id)
  );

drop policy if exists "games_insert" on games;
create policy "games_insert" on games
  for insert with check (auth.uid() = user_id);

drop policy if exists "games_update" on games;
create policy "games_update" on games
  for update using (auth.uid() = user_id);

drop policy if exists "games_delete" on games;
create policy "games_delete" on games
  for delete using (auth.uid() = user_id);

-- Game tags: insert/delete for game owners
drop policy if exists "game_tags_select" on game_tags;
create policy "game_tags_select" on game_tags
  for select using (true);

drop policy if exists "game_tags_insert" on game_tags;
create policy "game_tags_insert" on game_tags
  for insert with check (
    exists (select 1 from games where games.id = game_tags.game_id and games.user_id = auth.uid())
  );

drop policy if exists "game_tags_delete" on game_tags;
create policy "game_tags_delete" on game_tags
  for delete using (
    exists (select 1 from games where games.id = game_tags.game_id and games.user_id = auth.uid())
  );

-- Ratings: public read, insert/update own
drop policy if exists "ratings_select" on ratings;
create policy "ratings_select" on ratings
  for select using (true);

drop policy if exists "ratings_insert" on ratings;
create policy "ratings_insert" on ratings
  for insert with check (auth.uid() = user_id);

drop policy if exists "ratings_update" on ratings;
create policy "ratings_update" on ratings
  for update using (auth.uid() = user_id);

-- Seed categories
insert into categories (name) values
  ('Acción'),
  ('Aventura'),
  ('Puzzle'),
  ('Plataformas'),
  ('Carreras'),
  ('Deportes'),
  ('Estrategia'),
  ('Arcade'),
  ('Disparos'),
  ('Multijugador')
on conflict (name) do nothing;
