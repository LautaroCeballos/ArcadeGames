-- Add email column to profiles
alter table profiles add column if not exists email text;

-- Update trigger to use the username from auth.users.raw_user_meta_data and store email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;
