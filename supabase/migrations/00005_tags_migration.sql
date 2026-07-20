-- Seed tags: platform tags + existing categories (now tags)
insert into tags (name) values
  ('MakeCode Arcade'),
  ('Scratch'),
  ('Acción'),
  ('Aventura'),
  ('Puzzle'),
  ('Plataformas'),
  ('Carreras'),
  ('Deportes'),
  ('Estrategia'),
  ('Arcade'),
  ('Disparos'),
  ('Multijugador')
on conflict (name) do nothing;

-- Migrate existing category_id assignments to game_tags
insert into game_tags (game_id, tag_id)
select g.id, t.id
from games g
join categories c on c.id = g.category_id
join tags t on t.name = c.name
on conflict (game_id, tag_id) do nothing;

-- Add platform tag to each game
insert into game_tags (game_id, tag_id)
select g.id, t.id
from games g
join tags t on t.name = case when g.platform = 'scratch' then 'Scratch' else 'MakeCode Arcade' end
on conflict (game_id, tag_id) do nothing;

-- Drop the now-redundant category_id column
alter table games drop column category_id;
