-- Create rewards configuration table
CREATE TABLE IF NOT EXISTS public.reward_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  days_required INTEGER NOT NULL UNIQUE,
  reward_amount INTEGER NOT NULL,
  reward_title TEXT NOT NULL,
  reward_description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reward_milestones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view active reward milestones"
ON public.reward_milestones FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage reward milestones"
ON public.reward_milestones FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Insert default milestones
INSERT INTO public.reward_milestones (days_required, reward_amount, reward_title, reward_description)
VALUES 
  (7, 50, '7 Dias de Fogo! 🔥', 'Complete uma semana e ganhe RIOZ!'),
  (15, 120, '15 Dias Brilhantes! ⭐', 'Duas semanas de dedicação merecem recompensa!'),
  (30, 300, '30 Dias de Glória! 👑', 'Um mês completo! Você é incrível!')
ON CONFLICT (days_required) DO NOTHING;