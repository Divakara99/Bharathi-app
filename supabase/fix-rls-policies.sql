-- Fix RLS Policies for User Registration
-- This script updates the RLS policies to allow new user registration

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Create new policies that allow registration and proper access

-- Policy 1: Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow new user registration (INSERT) - This is the key fix
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Allow owners to view all users (for management purposes)
CREATE POLICY "Owners can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Policy 5: Allow owners to update user roles (for management purposes)
CREATE POLICY "Owners can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Verify the policies are working
-- You can test this by running:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
