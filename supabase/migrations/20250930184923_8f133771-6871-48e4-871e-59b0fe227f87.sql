-- Add API configuration fields to fast_pools table
ALTER TABLE fast_pools 
ADD COLUMN IF NOT EXISTS api_url TEXT,
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS api_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_api_sync TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN fast_pools.api_url IS 'External API URL for fetching live market data';
COMMENT ON COLUMN fast_pools.api_key IS 'API authentication key';
COMMENT ON COLUMN fast_pools.webhook_url IS 'Webhook URL for receiving real-time price updates';
COMMENT ON COLUMN fast_pools.api_connected IS 'Whether an external API is connected';
COMMENT ON COLUMN fast_pools.last_api_sync IS 'Last successful API data synchronization';