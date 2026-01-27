-- =====================================================
-- FIX RLS POLICIES FOR LOYALTY SYSTEM
-- Run this in Supabase SQL Editor to fix points issue
-- =====================================================

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can insert transactions for any user" ON public.transactions;

-- Step 2: Create the is_admin helper function (if not exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Add missing RLS policies for transactions

-- Admin can view all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.is_admin());

-- Users can insert their own transactions (for QR scanning)
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can insert transactions for ANY user (for manual adjustments)
CREATE POLICY "Admins can insert transactions for any user" ON public.transactions
  FOR INSERT WITH CHECK (public.is_admin());

-- Step 4: Create/Replace the increment_points RPC function
CREATE OR REPLACE FUNCTION increment_points(row_id uuid, count int)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + count
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify admin role in profiles (check your admin user)
-- Run this to see current roles:
SELECT id, full_name, whatsapp, role, points FROM public.profiles;

-- =====================================================
-- EXPECTED OUTPUT AFTER RUNNING:
-- You should see your admin user with role = 'admin'
-- If role is 'client' or 'user', update it:
-- UPDATE public.profiles SET role = 'admin' WHERE whatsapp = '+5215522222222';
-- =====================================================
