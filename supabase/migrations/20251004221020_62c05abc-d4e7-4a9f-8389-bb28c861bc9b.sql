-- Fix RLS policies for raffle image uploads in storage
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage raffle images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view raffle images" ON storage.objects;

-- Create policy for admins to upload/delete raffle images
CREATE POLICY "Admins can manage raffle images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'raffles' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'raffles' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Create policy for anyone to view raffle images
CREATE POLICY "Anyone can view raffle images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'raffles');