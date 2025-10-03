-- Fix infinite recursion in profiles RLS policies by dropping ALL policies and recreating

-- Drop ALL existing policies on profiles table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND is_admin = true
  )
$$;

-- Recreate simple, non-recursive policies
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins view all"
ON public.profiles
FOR SELECT
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Users update own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins update all"
ON public.profiles
FOR UPDATE
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Users insert own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);