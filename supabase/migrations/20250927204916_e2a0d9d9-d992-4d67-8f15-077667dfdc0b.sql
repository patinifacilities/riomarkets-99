-- Atualizar o usuário tmzzjr@gmail.com para ser admin
UPDATE profiles 
SET is_admin = true 
WHERE email = 'tmzzjr@gmail.com';