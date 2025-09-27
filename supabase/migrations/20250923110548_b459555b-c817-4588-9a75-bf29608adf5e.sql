-- Upsert 15 categories with proper IDs and order
INSERT INTO public.categories (id, nome, icon_url, ativo, ordem) VALUES
  ('esports', 'E-Sports', '', true, 1),
  ('cultura', 'Cultura Pop', '', true, 2),
  ('noticias', 'Notícias', '', true, 3),
  ('politica', 'Política', '', true, 4),
  ('economia', 'Economia', '', true, 5),
  ('esportes', 'Esportes', '', true, 6),
  ('tecnologia', 'Tecnologia', '', true, 7),
  ('entreten', 'Entretenimento', '', true, 8),
  ('clima', 'Clima', '', true, 9),
  ('musica', 'Música', '', true, 10),
  ('cinema', 'Cinema', '', true, 11),
  ('games', 'Games', '', true, 12),
  ('ciencia', 'Ciência', '', true, 13),
  ('cripto', 'Cripto', '', true, 14),
  ('educacao', 'Educação', '', true, 15)
ON CONFLICT (id) 
DO UPDATE SET 
  nome = EXCLUDED.nome,
  icon_url = EXCLUDED.icon_url,
  ativo = EXCLUDED.ativo,
  ordem = EXCLUDED.ordem;