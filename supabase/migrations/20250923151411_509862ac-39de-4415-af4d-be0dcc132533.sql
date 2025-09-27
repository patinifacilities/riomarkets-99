-- Insert sample data for testing the new MarketCardClean component

-- Insert sample categories if they don't exist
INSERT INTO public.categories (id, nome, icon_url, ordem) VALUES
('eco-1', 'economia', null, 1),
('esp-1', 'esportes', null, 2),
('pol-1', 'política', null, 3),
('cli-1', 'clima', null, 4),
('tec-1', 'tecnologia', null, 5),
('ent-1', 'entretenimento', null, 6)
ON CONFLICT (id) DO NOTHING;

-- Insert sample markets with new fields
INSERT INTO public.markets (id, titulo, descricao, categoria, opcoes, odds, status, end_date, thumbnail_url, periodicidade, destaque) VALUES
('market-1', 'Bitcoin chegará a $100.000 até final de 2024?', 'O preço do Bitcoin atingirá a marca histórica de $100.000 até dezembro de 2024', 'economia', '["sim", "não"]', '{"sim": 2.1, "não": 1.8}', 'aberto', '2024-12-31 23:59:59', null, 'Daily', true),
('market-2', 'Copa do Mundo FIFA 2026 - Brasil será campeão?', 'A seleção brasileira conquistará o hexacampeonato na Copa do Mundo de 2026', 'esportes', '["sim", "não"]', '{"sim": 3.2, "não": 1.4}', 'aberto', '2026-07-15 18:00:00', null, 'Weekly', false),
('market-3', 'Quem vencerá as próximas eleições presidenciais?', 'Candidato que será eleito presidente nas próximas eleições', 'política', '["Candidato A", "Candidato B", "Candidato C", "Outros"]', '{"Candidato A": 2.5, "Candidato B": 1.9, "Candidato C": 4.1, "Outros": 8.0}', 'aberto', '2026-10-30 20:00:00', null, 'Monthly', true),
('market-4', 'Temperatura média global aumentará 1.5°C até 2030?', 'A temperatura média global atingirá um aumento de 1.5°C em relação aos níveis pré-industriais', 'clima', '["sim", "não"]', '{"sim": 1.6, "não": 2.3}', 'aberto', '2030-12-31 23:59:59', null, null, false),
('market-5', 'OpenAI lançará GPT-5 em 2024?', 'A OpenAI anunciará e lançará oficialmente o GPT-5 ainda em 2024', 'tecnologia', '["sim", "não"]', '{"sim": 4.2, "não": 1.2}', 'fechado', '2024-12-31 23:59:59', null, 'Daily', false),
('market-6', 'Qual filme ganhará o Oscar de Melhor Filme 2025?', 'Filme que receberá o prêmio de Melhor Filme no Oscar 2025', 'entretenimento', '["Oppenheimer", "Killers of the Flower Moon", "Poor Things", "Outros"]', '{"Oppenheimer": 1.5, "Killers of the Flower Moon": 2.8, "Poor Things": 5.2, "Outros": 6.1}', 'liquidado', '2025-03-10 22:00:00', null, null, false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders to test pool calculations
INSERT INTO public.orders (id, user_id, market_id, opcao_escolhida, quantidade_moeda, preco, status) VALUES
('order-1', (SELECT id FROM auth.users LIMIT 1), 'market-1', 'sim', 500, 2.1, 'ativa'),
('order-2', (SELECT id FROM auth.users LIMIT 1), 'market-1', 'não', 300, 1.8, 'ativa'),
('order-3', (SELECT id FROM auth.users LIMIT 1), 'market-2', 'sim', 200, 3.2, 'ativa'),
('order-4', (SELECT id FROM auth.users LIMIT 1), 'market-3', 'Candidato A', 400, 2.5, 'ativa'),
('order-5', (SELECT id FROM auth.users LIMIT 1), 'market-3', 'Candidato B', 600, 1.9, 'ativa'),
('order-6', (SELECT id FROM auth.users LIMIT 1), 'market-4', 'sim', 800, 1.6, 'ativa')
ON CONFLICT (id) DO NOTHING;

-- Update market stats for the sample markets
SELECT public.update_market_stats('market-1');
SELECT public.update_market_stats('market-2');
SELECT public.update_market_stats('market-3');
SELECT public.update_market_stats('market-4');
SELECT public.update_market_stats('market-5');
SELECT public.update_market_stats('market-6');