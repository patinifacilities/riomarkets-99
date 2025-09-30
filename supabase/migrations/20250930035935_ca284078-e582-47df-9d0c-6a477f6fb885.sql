-- First remove the check constraint that's blocking 'demo' status
ALTER TABLE fast_pools DROP CONSTRAINT IF EXISTS fast_pools_status_check;

-- Add new constraint that allows 'demo' status
ALTER TABLE fast_pools ADD CONSTRAINT fast_pools_status_check 
CHECK (status IN ('active', 'completed', 'demo'));

-- Now insert the demo pools
INSERT INTO fast_pools (asset_symbol, asset_name, question, category, opening_price, round_start_time, round_end_time, base_odds, status, round_number) 
VALUES 
  ('GOLD', 'Ouro', 'O ouro vai subir nos próximos 60 segundos?', 'commodities', 2650.50, now(), now() + interval '60 seconds', 1.65, 'demo', 1000),
  ('OIL', 'Petróleo Brent', 'O petróleo vai subir nos próximos 60 segundos?', 'commodities', 89.75, now(), now() + interval '60 seconds', 1.65, 'demo', 1001),
  ('SILVER', 'Prata', 'A prata vai subir nos próximos 60 segundos?', 'commodities', 31.80, now(), now() + interval '60 seconds', 1.65, 'demo', 1002),
  ('ETH', 'Ethereum', 'O Ethereum vai subir nos próximos 60 segundos?', 'crypto', 3250.00, now(), now() + interval '60 seconds', 1.65, 'demo', 1004),
  ('SOL', 'Solana', 'A Solana vai subir nos próximos 60 segundos?', 'crypto', 145.50, now(), now() + interval '60 seconds', 1.65, 'demo', 1005),
  ('EURUSD', 'EUR/USD', 'O EUR/USD vai subir nos próximos 60 segundos?', 'forex', 1.0875, now(), now() + interval '60 seconds', 1.65, 'demo', 1006),
  ('GBPUSD', 'GBP/USD', 'O GBP/USD vai subir nos próximos 60 segundos?', 'forex', 1.3425, now(), now() + interval '60 seconds', 1.65, 'demo', 1007),
  ('USDJPY', 'USD/JPY', 'O USD/JPY vai subir nos próximos 60 segundos?', 'forex', 149.85, now(), now() + interval '60 seconds', 1.65, 'demo', 1008),
  ('AAPL', 'Apple Inc.', 'A Apple vai subir nos próximos 60 segundos?', 'stocks', 175.30, now(), now() + interval '60 seconds', 1.65, 'demo', 1009),
  ('TSLA', 'Tesla Inc.', 'A Tesla vai subir nos próximos 60 segundos?', 'stocks', 248.90, now(), now() + interval '60 seconds', 1.65, 'demo', 1010),
  ('MSFT', 'Microsoft Corp.', 'A Microsoft vai subir nos próximos 60 segundos?', 'stocks', 415.75, now(), now() + interval '60 seconds', 1.65, 'demo', 1011);