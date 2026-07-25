-- Convert rating system from 1-5 scale to binary star toggle.
-- All existing ratings become value = 1 (a star is a star).
-- New CHECK constraint enforces value = 1 (only 1 star per user per game).

update public.ratings set value = 1 where value != 1;

alter table public.ratings drop constraint if exists ratings_value_check;
alter table public.ratings add constraint ratings_value_check check (value = 1);
