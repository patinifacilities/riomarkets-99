-- Remove the old check constraint if it exists and add support for 'excluido' status
ALTER TABLE markets DROP CONSTRAINT IF EXISTS markets_status_check;

-- Add new check constraint that includes 'excluido'
ALTER TABLE markets ADD CONSTRAINT markets_status_check 
CHECK (status IN ('aberto', 'fechado', 'liquidado', 'excluido'));

-- Add index for better performance when filtering deleted markets
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);