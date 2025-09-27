-- Corrigir problema de segurança: adicionar política RLS para tabela settings
-- A tabela settings precisa de política pois tem RLS habilitado mas sem políticas

CREATE POLICY "Everyone can view settings" 
ON public.settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage settings" 
ON public.settings 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true 
));