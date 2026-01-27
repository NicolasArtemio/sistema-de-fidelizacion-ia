    -- =====================================================
    -- FIX EMAIL CONFIRMATION AND RLS FOR CLIENT REGISTRATION
    -- Run this in Supabase SQL Editor
    -- =====================================================

    -- Step 1: Check current auth settings (email confirmation status)
    -- NOTE: You need to disable email confirmation in Supabase Dashboard:
    -- Go to: Authentication > Providers > Email > Disable "Confirm email"

    -- Step 2: Check existing RLS policies on profiles
    SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
    FROM pg_policies 
    WHERE tablename = 'profiles';

    -- Step 3: Ensure users can INSERT their own profile
    -- Drop and recreate the insert policy to be more permissive
    DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
    DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.profiles;

    -- Create a policy that allows authenticated users to insert their own profile
    CREATE POLICY "Users can insert their own profile" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

    -- Step 4: Also allow the trigger (service role) to insert profiles
    -- The trigger runs with SECURITY DEFINER so it should work, but let's make sure

    -- Step 5: Check if there are any users stuck without profiles
    SELECT 
        u.id as auth_user_id,
        u.email,
        u.created_at as auth_created_at,
        p.id as profile_id,
        p.full_name,
        p.whatsapp,
        p.role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC
    LIMIT 20;

    -- Step 6: If you see users without profiles, you can create them:
    -- INSERT INTO public.profiles (id, full_name, whatsapp, points, role)
    -- SELECT id, email, SPLIT_PART(email, '@', 1), 0, 'user'
    -- FROM auth.users
    -- WHERE id NOT IN (SELECT id FROM public.profiles);

    -- =====================================================
    -- IMPORTANT: Disable Email Confirmation in Supabase Dashboard
    -- 
    -- 1. Go to: https://supabase.com/dashboard
    -- 2. Select your project
    -- 3. Go to: Authentication > Providers > Email
    -- 4. Turn OFF "Confirm email"
    -- 5. Save changes
    -- =====================================================
