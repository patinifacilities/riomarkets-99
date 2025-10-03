-- Add support for storing hidden state in slide_order
-- The slide_order column already exists as text[], but we need to support JSONB for hidden state
-- Drop the old column and recreate as JSONB
ALTER TABLE slider_config 
DROP COLUMN IF EXISTS slide_order;

ALTER TABLE slider_config 
ADD COLUMN slide_order JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN slider_config.slide_order IS 'Array of slide objects with id and hidden properties: [{"id": "market-id", "hidden": false}, ...]';