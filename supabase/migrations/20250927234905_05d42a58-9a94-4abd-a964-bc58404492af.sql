-- Update RLS policies for markets table to allow admin operations
DROP POLICY IF EXISTS "Admin can create markets" ON public.markets;
DROP POLICY IF EXISTS "Admin can update markets" ON public.markets;
DROP POLICY IF EXISTS "Admin can delete markets" ON public.markets;

-- Allow admins full access to markets
CREATE POLICY "Admin can create markets"
ON public.markets
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admin can update markets"
ON public.markets
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admin can delete markets"
ON public.markets
FOR DELETE
TO authenticated
USING (public.is_current_user_admin());