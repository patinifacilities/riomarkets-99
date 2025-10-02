-- Add new algorithm type and config to fast_pool_algorithm_config table
ALTER TABLE fast_pool_algorithm_config
ADD COLUMN IF NOT EXISTS algorithm_type text DEFAULT 'dynamic',
ADD COLUMN IF NOT EXISTS algo2_odds_high numeric DEFAULT 1.90,
ADD COLUMN IF NOT EXISTS algo2_odds_low numeric DEFAULT 1.10;

COMMENT ON COLUMN fast_pool_algorithm_config.algorithm_type IS 'Type of algorithm: dynamic (default) or price_based';
COMMENT ON COLUMN fast_pool_algorithm_config.algo2_odds_high IS 'High odds for algorithm 2 (price-based)';
COMMENT ON COLUMN fast_pool_algorithm_config.algo2_odds_low IS 'Low odds for algorithm 2 (price-based)';