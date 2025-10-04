-- Add new columns to raffles table
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT FALSE;

-- Update RLS policies to allow viewing paused raffles for display purposes
DROP POLICY IF EXISTS "Everyone can view active raffles" ON raffles;

CREATE POLICY "Everyone can view active raffles"
ON raffles FOR SELECT
USING (status = 'active' OR status = 'completed');