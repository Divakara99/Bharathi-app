-- Add missing RLS policies for user registration
-- Run this in your Supabase SQL Editor

-- Add policy to allow users to insert their own profile during registration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" ON public.users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Add policy to allow delivery partners to insert their own profile during registration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'delivery_partners' 
        AND policyname = 'Delivery partners can insert their own profile'
    ) THEN
        CREATE POLICY "Delivery partners can insert their own profile" ON public.delivery_partners
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Add policy to allow customers to create orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Customers can create orders'
    ) THEN
        CREATE POLICY "Customers can create orders" ON public.orders
            FOR INSERT WITH CHECK (customer_id = auth.uid());
    END IF;
END $$;

-- Add policy to allow delivery partners to update assigned orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Delivery partners can update assigned orders'
    ) THEN
        CREATE POLICY "Delivery partners can update assigned orders" ON public.orders
            FOR UPDATE USING (delivery_partner_id = auth.uid());
    END IF;
END $$;

-- Add policy to allow owner to manage all orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Owner can manage all orders'
    ) THEN
        CREATE POLICY "Owner can manage all orders" ON public.orders
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.id = auth.uid() AND users.role = 'owner'
                )
            );
    END IF;
END $$;
