-- Fix RLS policy for raffle image uploads in profile-pictures bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage raffle images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view raffle images" ON storage.objects;

-- Create correct RLS policies for raffle-images folder in profile-pictures bucket
CREATE POLICY "Admin can upload raffle images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'raffle-images'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can update raffle images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'raffle-images'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can delete raffle images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'raffle-images'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Public can view raffle images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'raffle-images'
);