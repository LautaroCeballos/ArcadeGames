-- Create notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in (
    'game_approved', 'game_rejected',
    'new_game_from_following',
    'new_rating', 'new_follower'
  )),
  title text not null,
  message text not null,
  link_url text not null,
  actor_id uuid references profiles(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on notifications(user_id) where not read;

-- Enable RLS
alter table notifications enable row level security;

-- RLS: Users can only see their own notifications
drop policy if exists "notifications_select" on notifications;
create policy "notifications_select" on notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS: Users can mark their own notifications as read
drop policy if exists "notifications_update" on notifications;
create policy "notifications_update" on notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Function: system-level notification creation (bypasses RLS for server actions)
-- Matches the award_badge pattern used elsewhere in the codebase
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link_url text,
  p_actor_id uuid default null
)
returns void as $$
begin
  insert into public.notifications (user_id, type, title, message, link_url, actor_id)
  values (p_user_id, p_type, p_title, p_message, p_link_url, p_actor_id);
end;
$$ language plpgsql security definer;
