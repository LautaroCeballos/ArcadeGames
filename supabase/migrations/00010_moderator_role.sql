-- Add role column to profiles
alter table profiles add column role text not null default 'user'
  check (role in ('user', 'moderator', 'admin'));

-- Index for role lookups
create index if not exists idx_profiles_role on profiles (role);

-- RLS: Moderators can SELECT any game (including pending/rejected/hidden)
drop policy if exists "games_select_moderator" on games;
create policy "games_select_moderator" on games
  for select using (
    auth.uid() in (
      select id from profiles where role in ('moderator', 'admin')
    )
  );

-- RLS: Moderators can UPDATE any game (approve/reject/edit)
drop policy if exists "games_update_moderator" on games;
create policy "games_update_moderator" on games
  for update using (
    auth.uid() in (
      select id from profiles where role in ('moderator', 'admin')
    )
  );

-- RLS: Moderators can DELETE any game
drop policy if exists "games_delete_moderator" on games;
create policy "games_delete_moderator" on games
  for delete using (
    auth.uid() in (
      select id from profiles where role in ('moderator', 'admin')
    )
  );

-- RLS: Moderators can INSERT/UPDATE/DELETE any game_tag
drop policy if exists "game_tags_insert_moderator" on game_tags;
create policy "game_tags_insert_moderator" on game_tags
  for insert with check (
    auth.uid() in (
      select id from profiles where role in ('moderator', 'admin')
    )
  );

drop policy if exists "game_tags_delete_moderator" on game_tags;
create policy "game_tags_delete_moderator" on game_tags
  for delete using (
    auth.uid() in (
      select id from profiles where role in ('moderator', 'admin')
    )
  );
