-- =====================================================
-- ADD PIN COLUMN TO PROFILES TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add the PIN column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pin text;

-- Step 2: Create index for faster lookups by WhatsApp (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles(whatsapp);

-- Step 3: Update the trigger function to handle PIN
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, whatsapp, points, role, pin)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'whatsapp', 'User'),
    new.raw_user_meta_data->>'whatsapp',
    0,
    'user',
    NULL  -- PIN will be set by the server action
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Add RLS policy for users to select their profile by whatsapp
-- (needed for checking if user exists during login)
DROP POLICY IF EXISTS "Anyone can check if whatsapp exists" ON public.profiles;
CREATE POLICY "Anyone can check if whatsapp exists" ON public.profiles
  FOR SELECT USING (true);  -- Allow reading profiles for login check

-- Note: This is intentionally permissive for the login flow.
-- The actual sensitive data should be protected at the application level.
-- In production, you might want to create a security-definer function instead.

-- Step 6: Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'pin';

-- Step 7: Show current profiles
SELECT id, full_name, whatsapp, role, points, pin FROM public.profiles LIMIT 10;
