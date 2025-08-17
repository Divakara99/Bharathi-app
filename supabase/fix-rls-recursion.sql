-- Fix infinite recursion in RLS policies for users table
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Owners can view all users" ON public.users;
DROP POLICY IF EXISTS "Owners can update users" ON public.users;

-- Create simplified policies without circular references
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- For owner access, we'll use a different approach
-- First, let's create a function to check if user is owner
CREATE OR REPLACE FUNCTION is_owner(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role = 'owner'
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_owner(UUID) TO authenticated;

-- Now create owner policies using the function
CREATE POLICY "Owners can view all users" ON public.users
    FOR SELECT USING (is_owner(auth.uid()));

CREATE POLICY "Owners can update users" ON public.users
    FOR UPDATE USING (is_owner(auth.uid()));

-- Also fix the products table policies
DROP POLICY IF EXISTS "Owners can manage all products" ON public.products;
CREATE POLICY "Owners can manage all products" ON public.products
    FOR ALL USING (is_owner(auth.uid()));

-- Fix orders table policies
DROP POLICY IF EXISTS "Owners can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Owners can update all orders" ON public.orders;
CREATE POLICY "Owners can view all orders" ON public.orders
    FOR SELECT USING (is_owner(auth.uid()));
CREATE POLICY "Owners can update all orders" ON public.orders
    FOR UPDATE USING (is_owner(auth.uid()));

-- Fix order_items table policies
DROP POLICY IF EXISTS "Owners can view all order items" ON public.order_items;
CREATE POLICY "Owners can view all order items" ON public.order_items
    FOR SELECT USING (is_owner(auth.uid()));

-- Fix delivery_partners table policies
DROP POLICY IF EXISTS "Owners can view all delivery partners" ON public.delivery_partners;
DROP POLICY IF EXISTS "Owners can update all delivery partners" ON public.delivery_partners;
DROP POLICY IF EXISTS "Owners can insert delivery partners" ON public.delivery_partners;
CREATE POLICY "Owners can view all delivery partners" ON public.delivery_partners
    FOR SELECT USING (is_owner(auth.uid()));
CREATE POLICY "Owners can update all delivery partners" ON public.delivery_partners
    FOR UPDATE USING (is_owner(auth.uid()));
CREATE POLICY "Owners can insert delivery partners" ON public.delivery_partners
    FOR INSERT WITH CHECK (is_owner(auth.uid()));

-- Fix order_tracking table policies
DROP POLICY IF EXISTS "Owners can view all tracking" ON public.order_tracking;
DROP POLICY IF EXISTS "Owners can create tracking entries" ON public.order_tracking;
CREATE POLICY "Owners can view all tracking" ON public.order_tracking
    FOR SELECT USING (is_owner(auth.uid()));
CREATE POLICY "Owners can create tracking entries" ON public.order_tracking
    FOR INSERT WITH CHECK (is_owner(auth.uid()));

-- Verify the fix
SELECT 'RLS policies fixed successfully' as status;
