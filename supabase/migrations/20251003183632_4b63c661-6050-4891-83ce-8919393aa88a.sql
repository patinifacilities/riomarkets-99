-- Add admin role to user with email Tmzzjr@gmail.com
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'Tmzzjr@gmail.com';
  
  -- Update the profile to set is_admin = true
  IF user_uuid IS NOT NULL THEN
    UPDATE profiles
    SET is_admin = true
    WHERE id = user_uuid;
  END IF;
END $$;