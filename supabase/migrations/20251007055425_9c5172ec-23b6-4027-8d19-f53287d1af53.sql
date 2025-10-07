-- Allow fractional raffle entry costs (down to 0.01 RZ)
-- Change entry_cost from integer to numeric
ALTER TABLE public.raffles 
ALTER COLUMN entry_cost TYPE numeric(10,2);

-- Also change ticket_count to ensure it exists as integer
ALTER TABLE public.raffles 
ADD COLUMN IF NOT EXISTS ticket_count integer DEFAULT 10000;