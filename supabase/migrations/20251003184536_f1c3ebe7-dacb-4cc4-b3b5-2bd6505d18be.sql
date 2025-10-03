-- Set admin status for the user Tmzzjr@gmail.com
-- This will work after they sign up with the specified credentials

-- First, ensure the email exists in profiles table before updating
-- This approach will set admin status after signup
DO $$
BEGIN
  -- Update admin status only if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE email = 'Tmzzjr@gmail.com') THEN
    UPDATE profiles 
    SET is_admin = true 
    WHERE email = 'Tmzzjr@gmail.com';
  END IF;
END $$;