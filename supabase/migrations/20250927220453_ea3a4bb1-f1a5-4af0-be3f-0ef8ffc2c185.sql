-- Fix RLS policies to allow admin actions

-- Update audit_logs policies to allow admin inserts
CREATE POLICY "Admin can insert audit logs" ON public.audit_logs
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Update wallet_transactions policies to allow admin inserts for balance adjustments
CREATE POLICY "Admin can insert wallet transactions" ON public.wallet_transactions
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);