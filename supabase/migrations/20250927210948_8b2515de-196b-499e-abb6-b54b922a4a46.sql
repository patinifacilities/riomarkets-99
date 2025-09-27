-- Create security definer function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Now update the profiles policy to use the function
DROP POLICY IF EXISTS "Users can view their own profile and admins can view all" ON profiles;

CREATE POLICY "Users can view their own profile and admins can view all" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() = id OR public.is_current_user_admin()
);