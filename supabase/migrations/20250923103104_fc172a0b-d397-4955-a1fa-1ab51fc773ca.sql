-- 1. Remover tabela users duplicada (mantendo apenas profiles)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Inserir mercados de exemplo para demonstração
INSERT INTO public.markets (id, titulo, descricao, categoria, opcoes, odds, status, end_date) VALUES
('market-tech-1', 'Apple vai anunciar iPhone 16 em setembro?', 'Mercado sobre o lançamento do próximo iPhone da Apple', 'Tecnologia', '["sim", "nao"]', '{"sim": 1.85, "nao": 1.95}', 'aberto', '2024-09-30 23:59:59+00'),
('market-crypto-1', 'Bitcoin vai atingir $100.000 até dezembro?', 'Previsão sobre o preço do Bitcoin no final do ano', 'Criptomoedas', '["sim", "nao"]', '{"sim": 2.1, "nao": 1.75}', 'aberto', '2024-12-31 23:59:59+00'),
('market-sports-1', 'Brasil vai se classificar para as quartas na Copa?', 'Classificação do Brasil na próxima Copa do Mundo', 'Esportes', '["sim", "nao"]', '{"sim": 1.65, "nao": 2.25}', 'aberto', '2024-11-30 23:59:59+00'),
('market-economy-1', 'Taxa Selic vai subir no próximo mês?', 'Previsão sobre mudanças na taxa básica de juros', 'Economia', '["sim", "nao"]', '{"sim": 1.90, "nao": 1.90}', 'aberto', '2024-10-15 23:59:59+00'),
('market-climate-1', 'Vai chover em São Paulo no próximo fim de semana?', 'Previsão meteorológica para São Paulo', 'Clima', '["sim", "nao"]', '{"sim": 1.70, "nao": 2.10}', 'aberto', '2024-09-29 23:59:59+00'),
('market-politics-1', 'Aprovação do presidente vai subir este mês?', 'Pesquisas de opinião sobre aprovação presidencial', 'Política', '["sim", "nao"]', '{"sim": 2.00, "nao": 1.80}', 'aberto', '2024-10-31 23:59:59+00');

-- 3. Inserir configuração inicial do sistema se não existir
INSERT INTO public.settings (fee_percent) 
SELECT 0.20 
WHERE NOT EXISTS (SELECT 1 FROM public.settings);