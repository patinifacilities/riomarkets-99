-- Create slider_config table to store slider settings
CREATE TABLE IF NOT EXISTS public.slider_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  selected_market_ids text[] DEFAULT '{}',
  custom_images jsonb DEFAULT '[]',
  slider_delay_seconds integer DEFAULT 7,
  slide_order text[] DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.slider_config ENABLE ROW LEVEL SECURITY;

-- Admin can manage slider config
CREATE POLICY "Admin can manage slider config"
ON public.slider_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Everyone can view slider config
CREATE POLICY "Everyone can view slider config"
ON public.slider_config
FOR SELECT
USING (true);

-- Insert default slider config
INSERT INTO public.slider_config (selected_market_ids, custom_images, slider_delay_seconds, slide_order)
VALUES ('{}', '[]', 7, '{}')
ON CONFLICT DO NOTHING;