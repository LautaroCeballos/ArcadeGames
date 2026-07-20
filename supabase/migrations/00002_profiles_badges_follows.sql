-- Add bio and website to profiles
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists website text;

-- Badges catalog
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text not null,
  icon_url text,
  criteria text not null,
  created_at timestamp default now()
);

-- User earned badges
create table if not exists user_badges (
  user_id uuid references profiles(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  earned_at timestamp default now(),
  primary key (user_id, badge_id)
);

-- Follows (followers / following)
create table if not exists follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamp default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Indexes
create index if not exists idx_follows_follower on follows (follower_id);
create index if not exists idx_follows_following on follows (following_id);
create index if not exists idx_user_badges_user on user_badges (user_id);

-- Enable RLS
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table follows enable row level security;

-- Badges: public read, admin write
drop policy if exists "badges_select" on badges;
create policy "badges_select" on badges for select using (true);

-- User badges: public read (to show on profiles), system/awarding via function
drop policy if exists "user_badges_select" on user_badges;
create policy "user_badges_select" on user_badges for select using (true);

drop policy if exists "user_badges_insert" on user_badges;
create policy "user_badges_insert" on user_badges
  for insert with check (auth.uid() = user_id);

-- Follows: public read, authenticated users can follow/unfollow others
drop policy if exists "follows_select" on follows;
create policy "follows_select" on follows for select using (true);

drop policy if exists "follows_insert" on follows;
create policy "follows_insert" on follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists "follows_delete" on follows;
create policy "follows_delete" on follows
  for delete using (auth.uid() = follower_id);

-- Seed automatic badges
insert into badges (name, description, icon_url, criteria) values
  ('Primer Juego', 'Publicaste tu primer juego en ArcadePlay', null, 'Publicar 1 juego'),
  ('Cinco Juegos', 'Publicaste 5 juegos en ArcadePlay', null, 'Publicar 5 juegos'),
  ('Diez Juegos', 'Publicaste 10 juegos en ArcadePlay', null, 'Publicar 10 juegos'),
  ('Primera Estrella', 'Recibiste tu primera estrella', null, 'Recibir 1 estrella en total'),
  ('50 Estrellas', 'Alcanzaste 50 estrellas en total', null, 'Recibir 50 estrellas en total'),
  ('100 Estrellas', 'Alcanzaste 100 estrellas en total', null, 'Recibir 100 estrellas en total'),
  ('1000 Vistas', 'Tus juegos suman 1000 visitas en total', null, 'Acumular 1000 vistas'),
  ('Explorador', 'Probaste 10 juegos de otros creadores', null, 'Votar 10 juegos distintos')
on conflict (name) do nothing;

-- Function: auto-award badge
create or replace function public.award_badge(user_id uuid, badge_name text)
returns void as $$
begin
  insert into public.user_badges (user_id, badge_id)
  select user_id, id from public.badges where name = badge_name
  on conflict do nothing;
end;
$$ language plpgsql security definer;

-- Function: recalculate stars for a game owner
create or replace function public.recalc_owner_stars(p_owner_id uuid)
returns integer as $$
declare
  total integer;
begin
  select coalesce(sum(r.value), 0) into total
  from public.ratings r
  join public.games g on g.id = r.game_id
  where g.user_id = p_owner_id;
  return total;
end;
$$ language plpgsql security definer;
