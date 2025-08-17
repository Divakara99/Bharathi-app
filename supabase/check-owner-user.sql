-- Check if owner user exists in public.users table
SELECT 
    id,
    email,
    role,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'akhildivakara@gmail.com';

-- Check if user exists in auth.users table
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'akhildivakara@gmail.com';

-- Check all users in public.users table
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users 
ORDER BY created_at DESC;
