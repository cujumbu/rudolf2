-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- Modify the users table to allow null PIN for admin users
ALTER TABLE public.users ALTER COLUMN pin DROP NOT NULL;

-- Add cascade delete trigger for auth.users when public.users are deleted
CREATE OR REPLACE FUNCTION delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_delete_auth_user
AFTER DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION delete_auth_user();

-- Add this after the existing SQL
INSERT INTO public.stations (
  id,
  name,
  location,
  device_id,
  is_active
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Main Station',
  'Main Office',
  'MAIN-001',
  true
) ON CONFLICT (device_id) DO NOTHING;

-- Create auth.users entries for existing administrators
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT 
  u.id,
  '00000000-0000-0000-0000-000000000000',
  u.email,
  crypt('temppass123', gen_salt('bf')), -- Temporary password that needs to be changed
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  json_build_object(
    'first_name', u.first_name,
    'last_name', u.last_name,
    'role', u.role
  ),
  u.created_at,
  u.updated_at,
  '',
  '',
  '',
  ''
FROM public.users u
WHERE u.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = u.id
  );