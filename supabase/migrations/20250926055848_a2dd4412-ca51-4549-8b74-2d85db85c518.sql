-- FASE 1: Database Schema para Exchange Interna Rioz Coin

-- Tabela de saldos dos usuários (Rioz e BRL)
CREATE TABLE public.balances (
  user_id UUID NOT NULL PRIMARY KEY,
  rioz_balance NUMERIC(20,6) NOT NULL DEFAULT 0,
  brl_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ordens de conversão (histórico)
CREATE TABLE public.exchange_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy_rioz', 'sell_rioz')),
  price_brl_per_rioz NUMERIC(12,6) NOT NULL,
  amount_rioz NUMERIC(20,6) NOT NULL,
  amount_brl NUMERIC(12,2) NOT NULL,
  fee_rioz NUMERIC(20,6) NOT NULL DEFAULT 0,
  fee_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cotações (fonte de verdade)
CREATE TABLE public.rates (
  symbol TEXT NOT NULL PRIMARY KEY DEFAULT 'RIOZBRL',
  price NUMERIC(12,6) NOT NULL,
  change24h NUMERIC(8,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- View para histórico do usuário
CREATE VIEW public.user_exchange_history_v AS
SELECT 
  eo.id,
  eo.user_id,
  eo.side,
  eo.price_brl_per_rioz,
  eo.amount_rioz,
  eo.amount_brl,
  eo.fee_rioz,
  eo.fee_brl,
  eo.status,
  eo.created_at,
  CASE 
    WHEN eo.side = 'buy_rioz' THEN 'Comprou Rioz'
    WHEN eo.side = 'sell_rioz' THEN 'Vendeu Rioz'
  END as operation_type
FROM public.exchange_orders eo
ORDER BY eo.created_at DESC;

-- Índices para performance
CREATE INDEX idx_balances_user_id ON public.balances(user_id);
CREATE INDEX idx_exchange_orders_user_id ON public.exchange_orders(user_id);
CREATE INDEX idx_exchange_orders_created_at ON public.exchange_orders(created_at DESC);
CREATE INDEX idx_exchange_orders_user_created ON public.exchange_orders(user_id, created_at DESC);
CREATE INDEX idx_rates_symbol ON public.rates(symbol);

-- RLS Policies
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;

-- Policies para balances
CREATE POLICY "Users can view their own balance" 
ON public.balances FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own balance" 
ON public.balances FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own balance" 
ON public.balances FOR UPDATE 
USING (user_id = auth.uid());

-- Policies para exchange_orders
CREATE POLICY "Users can view their own orders" 
ON public.exchange_orders FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders" 
ON public.exchange_orders FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Policies para rates (todos podem ver)
CREATE POLICY "Everyone can view rates" 
ON public.rates FOR SELECT 
USING (true);

-- Admin pode gerenciar rates
CREATE POLICY "Admin can manage rates" 
ON public.rates FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Inserir cotação inicial
INSERT INTO public.rates (symbol, price, change24h) 
VALUES ('RIOZBRL', 0.0015, 0.0000)
ON CONFLICT (symbol) DO NOTHING;

-- Função para inicializar saldo do usuário
CREATE OR REPLACE FUNCTION public.initialize_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.balances (user_id, rioz_balance, brl_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para inicializar saldo automaticamente
CREATE TRIGGER on_user_balance_init
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_balance();

-- Habilitar realtime para rates
ALTER publication supabase_realtime ADD TABLE public.rates;