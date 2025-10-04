-- Fix RLS policy for raffle image uploads
-- Allow authenticated users to insert images into the raffles bucket
DROP POLICY IF EXISTS "Authenticated users can upload raffle images" ON storage.objects;

CREATE POLICY "Authenticated users can upload raffle images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'raffles' AND auth.uid() IS NOT NULL);

-- Also allow users to view their own uploaded images
DROP POLICY IF EXISTS "Users can view raffle images" ON storage.objects;

CREATE POLICY "Users can view raffle images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'raffles');

-- Allow users to delete their own uploaded images
DROP POLICY IF EXISTS "Users can delete raffle images" ON storage.objects;

CREATE POLICY "Users can delete raffle images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'raffles' AND auth.uid() IS NOT NULL);