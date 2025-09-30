-- Fix RLS policies for fast_pools to allow edge function inserts
DROP POLICY IF EXISTS "Admin can manage fast pools" ON public.fast_pools;
DROP POLICY IF EXISTS "Everyone can view fast pools" ON public.fast_pools;

-- Create proper policies for fast_pools
CREATE POLICY "Everyone can view fast pools"
ON public.fast_pools
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage fast pools"
ON public.fast_pools
FOR ALL
USING (true);

-- Add missing columns to profiles table for auth enhancements  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for username uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique 
ON public.profiles(username) 
WHERE username IS NOT NULL;