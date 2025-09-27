-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT,
  is_admin BOOLEAN DEFAULT false,
  saldo_moeda INTEGER DEFAULT 1000,
  nivel TEXT CHECK (nivel IN ('iniciante', 'analista', 'guru', 'root')) DEFAULT 'iniciante',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create markets table
CREATE TABLE public.markets (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  opcoes JSONB NOT NULL,
  odds JSONB NOT NULL,
  status TEXT CHECK (status IN ('aberto', 'fechado', 'liquidado')) DEFAULT 'aberto',
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  market_id TEXT REFERENCES public.markets(id),
  opcao_escolhida TEXT NOT NULL,
  quantidade_moeda INTEGER NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('ativa', 'ganha', 'perdida')) DEFAULT 'ativa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  tipo TEXT CHECK (tipo IN ('credito', 'debito')) NOT NULL,
  valor INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create results table
CREATE TABLE public.results (
  market_id TEXT PRIMARY KEY REFERENCES public.markets(id),
  resultado_vencedor TEXT NOT NULL,
  data_liquidacao TIMESTAMPTZ DEFAULT NOW(),
  tx_executada BOOLEAN DEFAULT false
);

-- Insert seed data for users (using UUIDs)
INSERT INTO public.users (id, nome, email, senha_hash, is_admin, saldo_moeda, nivel, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin Master', 'admin@palpita.dev', '$2a$10$hashdemo', true, 100000, 'root', '2025-09-22T12:00:00Z'),
('00000000-0000-0000-0000-000000000002', 'Ana Ribeiro', 'ana@exemplo.com', '$2a$10$hashdemo', false, 1200, 'iniciante', '2025-09-22T12:01:00Z'),
('00000000-0000-0000-0000-000000000003', 'Caio Mendes', 'caio@exemplo.com', '$2a$10$hashdemo', false, 900, 'analista', '2025-09-22T12:01:30Z'),
('00000000-0000-0000-0000-000000000004', 'Lu Souza', 'lu@exemplo.com', '$2a$10$hashdemo', false, 1500, 'guru', '2025-09-22T12:02:00Z');

-- Insert seed data for markets
INSERT INTO public.markets (id, titulo, descricao, categoria, opcoes, odds, status, end_date, created_at) VALUES
('m_01', 'O dólar fecha > R$6,00 até 31/12?', 'Projeções de IPCA e câmbio até 31/12.', 'economia', '["sim","não"]', '{"sim": 1.80, "não": 2.00}', 'aberto', '2025-12-31T23:59:00Z', '2025-09-22T12:05:00Z'),
('m_02', 'Time X vence a final?', 'Final do campeonato nacional.', 'esportes', '["sim","não"]', '{"sim": 1.65, "não": 2.30}', 'aberto', '2025-10-21T20:00:00Z', '2025-09-22T12:06:00Z'),
('m_03', 'Chove no GP de São Paulo?', 'Probabilidade de chuva no dia da corrida.', 'clima', '["sim","não"]', '{"sim": 2.10, "não": 1.70}', 'fechado', '2025-10-05T15:00:00Z', '2025-09-22T12:07:00Z'),
('m_04', 'Projeto de lei Y é aprovado até nov?', 'Acompanhamento de tramitação.', 'política', '["sim","não"]', '{"sim": 1.95, "não": 1.95}', 'aberto', '2025-11-30T23:59:00Z', '2025-09-22T12:08:00Z'),
('m_05', 'Faturamento do e-commerce BR cresce >10% no Q4?', 'Comparação ano a ano.', 'economia', '["sim","não"]', '{"sim": 1.75, "não": 2.10}', 'liquidado', '2025-01-31T23:59:00Z', '2025-09-22T12:09:00Z');

-- Insert seed data for orders
INSERT INTO public.orders (id, user_id, market_id, opcao_escolhida, quantidade_moeda, preco, created_at) VALUES
('o_001', '00000000-0000-0000-0000-000000000002', 'm_01', 'sim', 200, 1.80, '2025-09-22T12:10:00Z'),
('o_002', '00000000-0000-0000-0000-000000000003', 'm_01', 'não', 150, 2.00, '2025-09-22T12:11:00Z'),
('o_003', '00000000-0000-0000-0000-000000000004', 'm_02', 'sim', 300, 1.65, '2025-09-22T12:12:00Z'),
('o_004', '00000000-0000-0000-0000-000000000002', 'm_03', 'sim', 100, 2.10, '2025-09-22T12:13:00Z'),
('o_005', '00000000-0000-0000-0000-000000000003', 'm_03', 'não', 200, 1.70, '2025-09-22T12:14:00Z'),
('o_006', '00000000-0000-0000-0000-000000000004', 'm_05', 'sim', 100, 1.75, '2025-09-22T12:15:00Z'),
('o_007', '00000000-0000-0000-0000-000000000003', 'm_05', 'não', 200, 2.10, '2025-09-22T12:16:00Z');

-- Insert seed data for wallet_transactions
INSERT INTO public.wallet_transactions (id, user_id, tipo, valor, descricao, created_at) VALUES
('wt_001', '00000000-0000-0000-0000-000000000002', 'credito', 1000, 'Bônus de boas-vindas', '2025-09-22T12:03:00Z'),
('wt_002', '00000000-0000-0000-0000-000000000003', 'credito', 1000, 'Bônus de boas-vindas', '2025-09-22T12:03:00Z'),
('wt_003', '00000000-0000-0000-0000-000000000004', 'credito', 1000, 'Bônus de boas-vindas', '2025-09-22T12:03:00Z'),
('wt_004', '00000000-0000-0000-0000-000000000002', 'debito', 200, 'Palpite m_01 (sim @1.80)', '2025-09-22T12:10:00Z'),
('wt_005', '00000000-0000-0000-0000-000000000003', 'debito', 150, 'Palpite m_01 (não @2.00)', '2025-09-22T12:11:00Z'),
('wt_006', '00000000-0000-0000-0000-000000000004', 'debito', 300, 'Palpite m_02 (sim @1.65)', '2025-09-22T12:12:00Z'),
('wt_007', '00000000-0000-0000-0000-000000000002', 'debito', 100, 'Palpite m_03 (sim @2.10)', '2025-09-22T12:13:00Z'),
('wt_008', '00000000-0000-0000-0000-000000000003', 'debito', 200, 'Palpite m_03 (não @1.70)', '2025-09-22T12:14:00Z'),
('wt_009', '00000000-0000-0000-0000-000000000004', 'debito', 100, 'Palpite m_05 (sim @1.75)', '2025-09-22T12:15:00Z'),
('wt_010', '00000000-0000-0000-0000-000000000003', 'debito', 200, 'Palpite m_05 (não @2.10)', '2025-09-22T12:16:00Z'),
('wt_011', '00000000-0000-0000-0000-000000000003', 'credito', 100, 'Liquidação m_05 (pro-rata vencedor "não")', '2025-09-22T12:30:00Z');

-- Insert seed data for results
INSERT INTO public.results (market_id, resultado_vencedor, data_liquidacao, tx_executada) VALUES
('m_05', 'não', '2025-09-22T12:30:00Z', true);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Create policies for markets (everyone can view, admin can modify)
CREATE POLICY "Everyone can view markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Admin can manage markets" ON public.markets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Create policies for users (users can view themselves, admin can view all)
CREATE POLICY "Users can view themselves" ON public.users FOR SELECT USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin can manage users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Create policies for orders (users can view their own orders, admin can view all)
CREATE POLICY "Users can view their orders" ON public.orders FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can manage orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Create policies for wallet_transactions (users can view their own transactions, admin can view all)
CREATE POLICY "Users can view their transactions" ON public.wallet_transactions FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin can manage transactions" ON public.wallet_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Create policies for results (everyone can view)
CREATE POLICY "Everyone can view results" ON public.results FOR SELECT USING (true);
CREATE POLICY "Admin can manage results" ON public.results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);