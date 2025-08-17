-- Complete Database Setup Script
-- Run this in your Supabase SQL Editor
-- This script creates all tables and policies from scratch

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('owner', 'customer', 'delivery_partner')) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    delivery_partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_instructions TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_partners table
CREATE TABLE IF NOT EXISTS public.delivery_partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true,
    current_location TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart table for customers
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID REFERENCES public.cart(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- Create order_tracking table for real-time updates
CREATE TABLE IF NOT EXISTS public.order_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owner can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'owner'
        )
    );

-- Orders policies
CREATE POLICY "Customers can view their own orders" ON public.orders
    FOR SELECT USING (
        customer_id = auth.uid() OR
        delivery_partner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'owner'
        )
    );

CREATE POLICY "Customers can create orders" ON public.orders
    FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Delivery partners can update assigned orders" ON public.orders
    FOR UPDATE USING (delivery_partner_id = auth.uid());

CREATE POLICY "Owner can manage all orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'owner'
        )
    );

-- Order items policies
CREATE POLICY "Order items follow order policies" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id AND (
                orders.customer_id = auth.uid() OR
                orders.delivery_partner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.id = auth.uid() AND users.role = 'owner'
                )
            )
        )
    );

-- Delivery partners policies
CREATE POLICY "Delivery partners can view their own profile" ON public.delivery_partners
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Delivery partners can update their own profile" ON public.delivery_partners
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Delivery partners can insert their own profile" ON public.delivery_partners
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can view all delivery partners" ON public.delivery_partners
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'owner'
        )
    );

-- Cart policies
CREATE POLICY "Customers can manage their own cart" ON public.cart
    FOR ALL USING (customer_id = auth.uid());

-- Cart items policies
CREATE POLICY "Customers can manage their own cart items" ON public.cart_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cart 
            WHERE cart.id = cart_items.cart_id AND cart.customer_id = auth.uid()
        )
    );

-- Order tracking policies
CREATE POLICY "Order tracking follows order policies" ON public.order_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_tracking.order_id AND (
                orders.customer_id = auth.uid() OR
                orders.delivery_partner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.id = auth.uid() AND users.role = 'owner'
                )
            )
        )
    );

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_partners_updated_at BEFORE UPDATE ON public.delivery_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON public.cart
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (name, description, price, image_url, category, stock) VALUES
('Fresh Milk', 'Organic whole milk from local farms', 45.00, '/images/milk.jpg', 'Dairy', 100),
('Bread', 'Fresh baked whole wheat bread', 35.00, '/images/bread.jpg', 'Bakery', 50),
('Eggs', 'Farm fresh eggs (12 pieces)', 60.00, '/images/eggs.jpg', 'Dairy', 200),
('Bananas', 'Fresh yellow bananas (1 kg)', 40.00, '/images/bananas.jpg', 'Fruits', 150),
('Tomatoes', 'Fresh red tomatoes (1 kg)', 30.00, '/images/tomatoes.jpg', 'Vegetables', 100),
('Onions', 'Fresh onions (1 kg)', 25.00, '/images/onions.jpg', 'Vegetables', 200),
('Potatoes', 'Fresh potatoes (1 kg)', 35.00, '/images/potatoes.jpg', 'Vegetables', 150),
('Rice', 'Basmati rice (1 kg)', 80.00, '/images/rice.jpg', 'Grains', 100),
('Sugar', 'White sugar (1 kg)', 45.00, '/images/sugar.jpg', 'Essentials', 100),
('Cooking Oil', 'Refined cooking oil (1L)', 120.00, '/images/oil.jpg', 'Essentials', 50)
ON CONFLICT DO NOTHING;
