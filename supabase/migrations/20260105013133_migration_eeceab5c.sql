-- Criar o utilizador admin de forma SIMPLES e CORRETA
-- usando a extensão pgcrypto para encriptar a password

-- Primeiro garantir que a extensão está ativa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar utilizador no auth.users com password encriptada corretamente
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  encrypted_pass TEXT;
BEGIN
  -- Encriptar a password Admin123! usando bcrypt com salt automático
  encrypted_pass := crypt('Admin123!', gen_salt('bf'));
  
  -- Inserir no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'admin@arroios.com',
    encrypted_pass,
    NOW(), -- Email já confirmado
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Inserir na tabela public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'admin@arroios.com',
    'Administrador',
    'admin',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Utilizador admin criado com sucesso! ID: %', new_user_id;
END $$;

-- Verificar que foi criado corretamente
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  u.full_name,
  u.role,
  'Password encriptada: ' || substring(au.encrypted_password, 1, 20) || '...' as password_check
FROM auth.users au
JOIN public.users u ON au.id = u.id
WHERE au.email = 'admin@arroios.com';