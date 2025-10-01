-- Add is_blocked column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Update RLS policies to check for blocked status
-- Users can still view their own profile even if blocked (to see the warning)
-- No changes needed to existing SELECT policy since they need to see their profile

COMMENT ON COLUMN public.profiles.is_blocked IS 'When true, user cannot place bets or withdraw funds';