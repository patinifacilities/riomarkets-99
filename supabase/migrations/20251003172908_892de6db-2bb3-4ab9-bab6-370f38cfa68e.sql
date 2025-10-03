-- Adicionar campo rules para mercados
ALTER TABLE public.markets
ADD COLUMN IF NOT EXISTS rules TEXT;