-- Seed more content tags for variety
insert into tags (name) values
  ('RPG'),
  ('Simulación'),
  ('Música'),
  ('Terror'),
  ('Supervivencia'),
  ('Educativo'),
  ('Laberinto'),
  ('Creativo')
on conflict (name) do nothing;
