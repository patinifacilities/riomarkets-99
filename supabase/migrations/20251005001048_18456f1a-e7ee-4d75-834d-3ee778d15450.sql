-- Fix storage RLS policies for raffle image uploads

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage raffle images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view raffle images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view raffle images" ON storage.objects;

-- Create admin policy for managing raffle images
CREATE POLICY "Admins can manage raffle images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'raffles' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'raffles' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Create public read policy for raffle images
CREATE POLICY "Anyone can view raffle images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'raffles');