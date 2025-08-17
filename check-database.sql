-- Check database status
-- Run this in your Supabase SQL Editor to see what's already set up

-- Check if tables exist
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'products', 'orders', 'order_items', 'delivery_partners', 'cart', 'cart_items', 'order_tracking')
ORDER BY table_name;

-- Check if policies exist
SELECT 
    tablename,
    policyname,
    CASE WHEN policyname IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if owner user exists
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users 
WHERE email = 'Akhildivakara@gmail.com';

-- Check sample products
SELECT 
    name,
    price,
    category,
    stock
FROM public.products 
LIMIT 5;
