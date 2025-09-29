-- Grant admin access to specified emails
UPDATE profiles 
SET is_admin = true 
WHERE email IN ('tnetdigital@gmail.com', 'tpb@patinibr.com.br');