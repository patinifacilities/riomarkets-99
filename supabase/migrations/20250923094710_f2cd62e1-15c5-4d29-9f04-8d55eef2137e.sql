-- Insert new categories and markets data
INSERT INTO public.markets (id, titulo, descricao, categoria, opcoes, odds, status, end_date, created_at) VALUES
-- Economia
('m_06', 'O Brasil terá inflação >6% em 2025?', 'Projeções macroeconômicas até fim do ano.', 'economia', '["sim","não"]', '{"sim": 1.8, "não": 2.0}', 'aberto', '2025-12-31T23:59:00Z', '2025-09-22T13:00:00Z'),
('m_12', 'O PIB do Brasil cresce >3% em 2025?', 'Dados oficiais do IBGE.', 'economia', '["sim","não"]', '{"sim": 2.2, "não": 1.7}', 'aberto', '2026-03-31T23:59:00Z', '2025-09-22T13:12:00Z'),
('m_20', 'O preço da gasolina no Brasil cai abaixo de R$5,00 até mar/2026?', 'Projeções de mercado energético.', 'economia', '["sim","não"]', '{"sim": 2.5, "não": 1.5}', 'aberto', '2026-03-31T23:59:00Z', '2025-09-22T13:28:00Z'),

-- Esportes  
('m_07', 'O Flamengo será campeão do Brasileirão 2025?', 'Decisão do campeonato nacional.', 'esportes', '["sim","não"]', '{"sim": 1.9, "não": 1.9}', 'aberto', '2025-12-08T20:00:00Z', '2025-09-22T13:02:00Z'),
('m_11', 'A Seleção Brasileira chega à final da Copa América 2026?', 'Torneio continental.', 'esportes', '["sim","não"]', '{"sim": 2.1, "não": 1.8}', 'aberto', '2026-07-15T20:00:00Z', '2025-09-22T13:10:00Z'),
('m_15', 'O Corinthians será rebaixado no Brasileirão 2025?', 'Disputa de campeonato.', 'esportes', '["sim","não"]', '{"sim": 3.0, "não": 1.3}', 'aberto', '2025-12-08T20:00:00Z', '2025-09-22T13:18:00Z'),

-- Política
('m_08', 'O STF julgará caso X até novembro?', 'Agenda do Supremo Tribunal Federal.', 'política', '["sim","não"]', '{"sim": 1.6, "não": 2.3}', 'aberto', '2025-11-20T23:59:00Z', '2025-09-22T13:04:00Z'),
('m_16', 'O Congresso aprova reforma tributária até dezembro/2025?', 'Tramitação legislativa.', 'política', '["sim","não"]', '{"sim": 1.7, "não": 2.1}', 'aberto', '2025-12-31T23:59:00Z', '2025-09-22T13:20:00Z'),

-- Clima
('m_09', 'Chove mais de 50mm em São Paulo na semana de 10/10?', 'Previsão meteorológica para SP.', 'clima', '["sim","não"]', '{"sim": 2.0, "não": 1.8}', 'aberto', '2025-10-10T23:59:00Z', '2025-09-22T13:06:00Z'),
('m_17', 'O inverno 2025 será o mais frio dos últimos 10 anos?', 'Projeções meteorológicas nacionais.', 'clima', '["sim","não"]', '{"sim": 2.8, "não": 1.4}', 'aberto', '2025-09-30T23:59:00Z', '2025-09-22T13:22:00Z'),

-- Tecnologia
('m_10', 'Apple lança iPhone 17 até setembro/2026?', 'Rumores de lançamento de produto.', 'tecnologia', '["sim","não"]', '{"sim": 1.5, "não": 2.4}', 'aberto', '2026-09-30T23:59:00Z', '2025-09-22T13:08:00Z'),
('m_14', 'Bitcoin atinge US$100k até junho/2026?', 'Mercado cripto global.', 'tecnologia', '["sim","não"]', '{"sim": 2.3, "não": 1.6}', 'aberto', '2026-06-30T23:59:00Z', '2025-09-22T13:16:00Z'),
('m_18', 'A Tesla inaugura fábrica no Brasil até 2027?', 'Expansão de multinacionais.', 'tecnologia', '["sim","não"]', '{"sim": 2.7, "não": 1.4}', 'aberto', '2027-12-31T23:59:00Z', '2025-09-22T13:24:00Z'),

-- Entretenimento
('m_13', 'O Oscar 2026 terá filme brasileiro indicado a Melhor Filme?', 'Premiação de Hollywood.', 'entretenimento', '["sim","não"]', '{"sim": 4.0, "não": 1.2}', 'aberto', '2026-02-28T23:59:00Z', '2025-09-22T13:14:00Z'),
('m_19', 'A série brasileira X será indicada ao Emmy 2026?', 'Reconhecimento internacional.', 'entretenimento', '["sim","não"]', '{"sim": 3.5, "não": 1.25}', 'aberto', '2026-09-15T23:59:00Z', '2025-09-22T13:26:00Z');