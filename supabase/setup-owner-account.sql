-- BHARATHI ENTERPRISES - Owner Account Setup
-- Run this AFTER creating the owner user in Supabase Auth Dashboard

-- Step 1: Get the owner's UUID from auth.users
-- Replace 'Akhildivakara@gmail.com' with the actual email if different
SELECT id, email FROM auth.users WHERE email = 'Akhildivakara@gmail.com';

-- Step 2: Insert owner record into public.users
-- Replace 'YOUR_OWNER_UUID_HERE' with the actual UUID from Step 1
INSERT INTO public.users (id, email, role, full_name, created_at, updated_at)
VALUES (
    'YOUR_OWNER_UUID_HERE', -- Replace with actual UUID
    'Akhildivakara@gmail.com',
    'owner',
    'BHARATHI ENTERPRISES Owner',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'owner',
    full_name = 'BHARATHI ENTERPRISES Owner',
    updated_at = NOW();

-- Step 3: Create default settings for owner
INSERT INTO public.user_settings (user_id, notifications_enabled, email_notifications, dark_mode, language, timezone)
VALUES (
    'YOUR_OWNER_UUID_HERE', -- Replace with actual UUID
    true,
    true,
    false,
    'en',
    'Asia/Kolkata'
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Verify owner setup
SELECT 
    u.id,
    u.email,
    u.role,
    u.full_name,
    u.created_at,
    us.notifications_enabled,
    us.language,
    us.timezone
FROM public.users u
LEFT JOIN public.user_settings us ON u.id = us.user_id
WHERE u.email = 'Akhildivakara@gmail.com';

-- Step 5: Test owner permissions
-- This should return the owner record
SELECT * FROM public.users WHERE role = 'owner';

-- ========================================
-- ALTERNATIVE: If you know the UUID already
-- ========================================

-- If you already have the UUID, you can run this directly:
/*
INSERT INTO public.users (id, email, role, full_name, created_at, updated_at)
VALUES (
    'd82eae53-e591-4835-842a-8ee373b84c98', -- Example UUID, replace with actual
    'Akhildivakara@gmail.com',
    'owner',
    'BHARATHI ENTERPRISES Owner',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'owner',
    full_name = 'BHARATHI ENTERPRISES Owner',
    updated_at = NOW();
*/

-- ========================================
-- TROUBLESHOOTING
-- ========================================

-- If you get errors, check these:

-- 1. Check if owner exists in auth.users
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'Akhildivakara@gmail.com';

-- 2. Check if owner exists in public.users
SELECT * FROM public.users WHERE email = 'Akhildivakara@gmail.com';

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 4. Test owner login
-- Go to your app and try logging in with:
-- Email: Akhildivakara@gmail.com
-- Password: 9959827826Dd@

-- ========================================
-- SUCCESS INDICATORS
-- ========================================

-- After successful setup, you should see:
-- ✅ Owner record in public.users with role = 'owner'
-- ✅ Owner settings in public.user_settings
-- ✅ Ability to log in and access owner dashboard
-- ✅ Access to all owner features (products, orders, delivery partners, analytics)

-- If everything works, you can proceed to test customer and delivery partner registration!
