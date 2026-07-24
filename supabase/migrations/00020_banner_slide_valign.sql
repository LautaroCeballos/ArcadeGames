-- Add vertical alignment option to banner_slides
-- panel_valign: vertical alignment of the panel (top, center, bottom)
alter table public.banner_slides
  add column panel_valign text not null default 'center'
  check (panel_valign in ('top', 'center', 'bottom'));
