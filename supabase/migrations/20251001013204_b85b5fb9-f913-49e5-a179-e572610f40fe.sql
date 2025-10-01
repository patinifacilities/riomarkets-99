-- Add icon_url and photo_url columns to markets table
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.markets.icon_url IS 'URL to the market icon/logo (small square image)';
COMMENT ON COLUMN public.markets.photo_url IS 'URL to the market main photo/banner (displayed in detail page)';