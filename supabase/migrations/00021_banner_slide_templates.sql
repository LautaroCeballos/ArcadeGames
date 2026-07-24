-- Replace granular panel options with template system
-- Templates define the entire layout: bar-right, bar-left, full-image
alter table public.banner_slides
  add column template text not null default 'bar-right'
  check (template in ('bar-right', 'bar-left', 'full-image'));
