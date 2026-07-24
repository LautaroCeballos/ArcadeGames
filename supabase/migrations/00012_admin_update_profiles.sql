-- Allow admins to update any profile (role management)
drop policy if exists "profiles_update_admin" on profiles;
create policy "profiles_update_admin" on profiles
  for update using (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );
