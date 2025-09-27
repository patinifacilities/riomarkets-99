-- Remove duplicate category and ensure we have clean data
DELETE FROM public.categories WHERE id = 'news';

-- Verify we have our expected categories
SELECT id, nome, ativo, ordem FROM public.categories ORDER BY ordem ASC;