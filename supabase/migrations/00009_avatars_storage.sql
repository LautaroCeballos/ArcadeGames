-- Create avatars storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, '{"image/png", "image/jpeg", "image/webp", "image/gif"}')
on conflict (id) do nothing;

-- Allow public read access
create policy "avatars_select"
on storage.objects for select
using (bucket_id = 'avatars');

-- Allow authenticated users to upload
create policy "avatars_insert"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
create policy "avatars_update"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid() = owner
);

-- Allow users to delete their own uploads
create policy "avatars_delete"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid() = owner
);
