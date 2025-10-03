-- Add RLS policy for admins to upload to profile-pictures bucket
CREATE POLICY "Admins can upload branding files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Add RLS policy for admins to update branding files
CREATE POLICY "Admins can update branding files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Add RLS policy for everyone to view branding files
CREATE POLICY "Everyone can view branding files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'branding'
);