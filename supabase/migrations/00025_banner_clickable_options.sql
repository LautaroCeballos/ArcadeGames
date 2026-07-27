-- Add clickable and open_in_new_tab options for full-image banner slides
alter table public.banner_slides
  add column clickable boolean not null default true,
  add column open_in_new_tab boolean not null default true;
