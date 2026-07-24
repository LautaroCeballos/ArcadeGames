-- Add panel layout options to banner_slides
-- show_panel: whether to show the floating info panel
-- panel_align: horizontal alignment of the panel (left, center, right)
-- button_mode: how to display the CTA button (full, only, none)
alter table public.banner_slides
  add column show_panel boolean not null default true,
  add column panel_align text not null default 'right',
  add column button_mode text not null default 'full';
