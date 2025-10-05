-- Add display_order column to raffles table
ALTER TABLE public.raffles 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Set initial display_order based on created_at
UPDATE public.raffles 
SET display_order = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 as row_number 
  FROM public.raffles
) as numbered 
WHERE raffles.id = numbered.id;