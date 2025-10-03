-- Add logo_light_url column to branding_config table
ALTER TABLE public.branding_config 
ADD COLUMN IF NOT EXISTS logo_light_url TEXT;