-- Add paused column to fast_pools table
ALTER TABLE fast_pools ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN fast_pools.paused IS 'Indicates if the pool is paused by admin';