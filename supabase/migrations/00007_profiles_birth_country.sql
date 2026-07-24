-- Add birth_month, birth_year, and country to profiles
alter table profiles add column if not exists birth_month integer check (birth_month >= 1 and birth_month <= 12);
alter table profiles add column if not exists birth_year integer check (birth_year >= 1900 and birth_year <= date_part('year', now())::int);
alter table profiles add column if not exists country text;
