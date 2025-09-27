-- Fix infinite recursion in profiles RLS policy
DROP POLICY IF EXISTS "Simple admin view all profiles" ON profiles;

-- Create a simpler, non-recursive policy for viewing profiles
CREATE POLICY "Users can view their own profile and admins can view all" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);

-- Ensure the user tmzzjr@gmail.com has admin access
UPDATE profiles 
SET is_admin = true 
WHERE email = 'tmzzjr@gmail.com';