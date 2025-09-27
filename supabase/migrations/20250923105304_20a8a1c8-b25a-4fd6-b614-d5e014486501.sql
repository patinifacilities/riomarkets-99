-- Add RLS policies for wallet_transactions table
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true 
));