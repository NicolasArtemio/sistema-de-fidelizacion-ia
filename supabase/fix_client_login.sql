-- =====================================================
-- FIX CLIENT LOGIN - RUN THIS IN SUPABASE SQL EDITOR
-- This fixes profile insertion for new clients
-- =====================================================

-- The issue is that new users may not have their auth.uid() available
-- when the server tries to insert a profile right after signup.
-- The trigger should handle this, but we need to make sure.

-- Option 1: Make sure the trigger function is using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, whatsapp, points, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'whatsapp', 'User'),
    new.raw_user_meta_data->>'whatsapp',
    0,
    'user'  -- Always 'user' for new signups, never 'admin'
  )
  ON CONFLICT (id) DO NOTHING;  -- Avoid duplicate errors if profile already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Option 2: Also allow the service role to insert profiles (for server actions)
-- By making the insert policy more permissive during registration
-- (The SECURITY DEFINER on the function above should handle this)

-- Verify everything is working:
SELECT 'Trigger and function updated!' as status;

-- Check existing profiles:
SELECT id, full_name, whatsapp, role, points FROM public.profiles ORDER BY created_at DESC LIMIT 10;
