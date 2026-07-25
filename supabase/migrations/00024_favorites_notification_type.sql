-- Add 'new_favorite' to notifications.type CHECK constraint

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'game_approved', 'game_rejected',
    'new_game_from_following',
    'new_rating', 'new_follower',
    'new_favorite'
  ));
