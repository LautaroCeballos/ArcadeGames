-- Add platform column to games table
-- makecode = MakeCode Arcade (default, existing)
-- scratch = Scratch (MIT)
alter table games add column if not exists platform text not null default 'makecode';
alter table games add constraint games_platform_check check (platform in ('makecode', 'scratch'));

-- Update RLS to include platform (no changes needed, existing policies cover all columns)
-- Index for filtering by platform
create index if not exists idx_games_platform on games (platform);
