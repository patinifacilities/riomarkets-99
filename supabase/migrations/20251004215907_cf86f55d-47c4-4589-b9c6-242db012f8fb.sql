-- Fix RLS policy for raffle image uploads
-- The current policy requires auth but doesn't check if user is admin
-- This causes issues when admins try to upload raffle images

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can upload raffle images" ON storage.objects;

-- Create new policy that allows admins to upload raffle images
CREATE POLICY "Admins can upload raffle images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'raffles' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Also update the delete policy to be admin-only
DROP POLICY IF EXISTS "Users can delete raffle images" ON storage.objects;

CREATE POLICY "Admins can delete raffle images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'raffles' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);