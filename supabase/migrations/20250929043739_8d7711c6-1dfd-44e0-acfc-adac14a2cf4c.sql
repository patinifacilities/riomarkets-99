-- Add thumbnail_url column to markets table if not exists
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;