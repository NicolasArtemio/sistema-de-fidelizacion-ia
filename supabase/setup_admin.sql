-- =====================================================
-- SETUP ADMIN ACCOUNT - RUN IN SUPABASE SQL EDITOR
-- =====================================================

-- Step 1: Check if admin user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = '2284716778@loyalty.app';

-- Step 2: Check if admin profile exists
SELECT id, full_name, whatsapp, role, pin 
FROM public.profiles 
WHERE whatsapp = '2284716778';

-- Step 3: If the user exists but role is not 'admin', fix it:
UPDATE public.profiles 
SET role = 'admin' 
WHERE whatsapp = '2284716778';

-- =====================================================
-- IF NO USER EXISTS:
-- You need to create the admin account through the app first.
-- 
-- TEMPORARY FIX: 
-- 1. In actions.ts, temporarily comment out the admin block check
-- 2. Login as a regular client with WhatsApp: 2284716778 and a PIN
-- 3. Then update the role to 'admin' using the SQL above
-- 4. Then update the password in Supabase Dashboard
-- 5. Uncomment the admin block check
-- =====================================================

-- Step 4: View all users and their auth emails
SELECT 
    p.id,
    p.full_name,
    p.whatsapp,
    p.role,
    u.email,
    u.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY u.created_at DESC;
