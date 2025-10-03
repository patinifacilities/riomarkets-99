-- Create exchange-assets storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('exchange-assets', 'exchange-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for exchange-assets bucket
CREATE POLICY "Admins can upload exchange asset icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exchange-assets' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

CREATE POLICY "Admins can update exchange asset icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exchange-assets' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

CREATE POLICY "Admins can delete exchange asset icons"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exchange-assets' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

CREATE POLICY "Everyone can view exchange asset icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'exchange-assets');

-- RLS policies for profiles table to allow admin actions
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);