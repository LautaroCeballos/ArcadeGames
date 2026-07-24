-- Create banner_slides table for home page hero carousel
create table banner_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  title text not null,
  description text,
  cta_text text not null,
  cta_link text not null default '/',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for ordering
create index if not exists idx_banner_slides_sort_order on banner_slides (sort_order, created_at);

-- RLS
alter table banner_slides enable row level security;

-- Public read (only active slides for UI)
drop policy if exists "banner_slides_select" on banner_slides;
create policy "banner_slides_select" on banner_slides
  for select using (true);

-- Only admins can insert
drop policy if exists "banner_slides_insert" on banner_slides;
create policy "banner_slides_insert" on banner_slides
  for insert with check (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- Only admins can update
drop policy if exists "banner_slides_update" on banner_slides;
create policy "banner_slides_update" on banner_slides
  for update using (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- Only admins can delete
drop policy if exists "banner_slides_delete" on banner_slides;
create policy "banner_slides_delete" on banner_slides
  for delete using (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- Create banners storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banners', 'banners', true, 2097152, '{"image/png", "image/jpeg", "image/webp"}')
on conflict (id) do nothing;

-- Storage policies for banners bucket
drop policy if exists "banners_select" on storage.objects;
create policy "banners_select"
on storage.objects for select
using (bucket_id = 'banners');

drop policy if exists "banners_insert" on storage.objects;
create policy "banners_insert"
on storage.objects for insert
with check (
  bucket_id = 'banners'
  and auth.role() = 'authenticated'
  and auth.uid() in (
    select id from profiles where role = 'admin'
  )
);

drop policy if exists "banners_update" on storage.objects;
create policy "banners_update"
on storage.objects for update
using (
  bucket_id = 'banners'
  and auth.role() = 'authenticated'
  and auth.uid() in (
    select id from profiles where role = 'admin'
  )
);

drop policy if exists "banners_delete" on storage.objects;
create policy "banners_delete"
on storage.objects for delete
using (
  bucket_id = 'banners'
  and auth.role() = 'authenticated'
  and auth.uid() in (
    select id from profiles where role = 'admin'
  )
);
