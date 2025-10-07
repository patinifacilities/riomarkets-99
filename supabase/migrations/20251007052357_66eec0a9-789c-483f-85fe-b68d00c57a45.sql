-- Add ticket_count column to raffles table
ALTER TABLE public.raffles
ADD COLUMN IF NOT EXISTS ticket_count INTEGER NOT NULL DEFAULT 10000;

-- Add comment to explain the column
COMMENT ON COLUMN public.raffles.ticket_count IS 'Total number of tickets available for this raffle (10000, 100000, 500000, or 1000000)';

-- Update existing raffles to have default ticket count
UPDATE public.raffles
SET ticket_count = 10000
WHERE ticket_count IS NULL;