-- Add ends_at field to raffles table for countdown timer
ALTER TABLE public.raffles ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

-- Create raffle_slider_config table for raffle page banner
CREATE TABLE IF NOT EXISTS public.raffle_slider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  images JSONB DEFAULT '[]'::jsonb,
  slide_order JSONB DEFAULT '[]'::jsonb,
  slider_delay_seconds INTEGER DEFAULT 7,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on raffle_slider_config
ALTER TABLE public.raffle_slider_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for raffle_slider_config
CREATE POLICY "Everyone can view raffle slider config"
  ON public.raffle_slider_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage raffle slider config"
  ON public.raffle_slider_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert default config if none exists
INSERT INTO public.raffle_slider_config (images, slide_order, slider_delay_seconds)
VALUES ('[]'::jsonb, '[]'::jsonb, 7)
ON CONFLICT DO NOTHING;