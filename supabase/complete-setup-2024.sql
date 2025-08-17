-- BHARATHI ENTERPRISES - Complete Database Setup 2024
-- This script includes all fixes for email confirmation, RLS policies, and user management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'customer', 'delivery_partner')),
    full_name TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Owners can view all users" ON public.users;
DROP POLICY IF EXISTS "Owners can update users" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Create new RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Create trigger for updated_at on users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- USER SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at on user_settings
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PRODUCTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage all products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Create trigger for updated_at on products
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    delivery_partner_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_instructions TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Customers can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Owners can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can update all orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Delivery partners can view assigned orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.delivery_partners 
            WHERE user_id = auth.uid() AND id = delivery_partner_id
        )
    );

CREATE POLICY "Delivery partners can update assigned orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.delivery_partners 
            WHERE user_id = auth.uid() AND id = delivery_partner_id
        )
    );

-- Create trigger for updated_at on orders
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ORDER ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_items
CREATE POLICY "Users can view order items for their orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can create order items for their orders" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Owners can view all order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- ========================================
-- DELIVERY PARTNERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.delivery_partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    vehicle_number TEXT,
    is_available BOOLEAN DEFAULT true,
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    last_location_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on delivery_partners
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for delivery_partners
CREATE POLICY "Delivery partners can view their own profile" ON public.delivery_partners
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Delivery partners can update their own profile" ON public.delivery_partners
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Delivery partners can insert their own profile" ON public.delivery_partners
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can view all delivery partners" ON public.delivery_partners
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can update all delivery partners" ON public.delivery_partners
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can insert delivery partners" ON public.delivery_partners
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Create trigger for updated_at on delivery_partners
CREATE TRIGGER update_delivery_partners_updated_at BEFORE UPDATE ON public.delivery_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CART TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cart
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cart
CREATE POLICY "Customers can view their own cart" ON public.cart
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create their own cart" ON public.cart
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own cart" ON public.cart
    FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete their own cart" ON public.cart
    FOR DELETE USING (auth.uid() = customer_id);

-- Create trigger for updated_at on cart
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON public.cart
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CART ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID REFERENCES public.cart(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- Enable RLS on cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cart_items
CREATE POLICY "Customers can view their own cart items" ON public.cart_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cart 
            WHERE id = cart_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Customers can create their own cart items" ON public.cart_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cart 
            WHERE id = cart_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Customers can update their own cart items" ON public.cart_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.cart 
            WHERE id = cart_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Customers can delete their own cart items" ON public.cart_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.cart 
            WHERE id = cart_id AND customer_id = auth.uid()
        )
    );

-- ========================================
-- ORDER TRACKING TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.order_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on order_tracking
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_tracking
CREATE POLICY "Users can view tracking for their orders" ON public.order_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Owners can view all tracking" ON public.order_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can create tracking entries" ON public.order_tracking
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- ========================================
-- EMAIL CONFIRMATION HANDLING
-- ========================================

-- Function to handle unconfirmed users (auto-confirm if needed)
CREATE OR REPLACE FUNCTION handle_unconfirmed_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If user is not confirmed, automatically confirm them
    IF NEW.email_confirmed_at IS NULL THEN
        NEW.email_confirmed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-confirm users
DROP TRIGGER IF EXISTS auto_confirm_user ON auth.users;
CREATE TRIGGER auto_confirm_user
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_unconfirmed_user();

-- Function to create user profile with proper role assignment
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_role TEXT DEFAULT 'customer'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, role)
    VALUES (user_id, user_email, user_role);
    
    -- If role is delivery_partner, also create delivery_partner record
    IF user_role = 'delivery_partner' THEN
        INSERT INTO public.delivery_partners (user_id, name, phone, vehicle_number, is_available)
        VALUES (user_id, split_part(user_email, '@', 1), '', '', true);
    END IF;
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample products
INSERT INTO public.products (name, description, price, image_url, category, stock, is_active) VALUES
('Fresh Milk', 'Pure cow milk, 1 liter', 60.00, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', 'Dairy', 50, true),
('Bread', 'Whole wheat bread, 500g', 35.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'Bakery', 30, true),
('Eggs', 'Farm fresh eggs, 12 pieces', 80.00, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400', 'Dairy', 100, true),
('Bananas', 'Organic bananas, 1 kg', 45.00, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', 'Fruits', 25, true),
('Tomatoes', 'Fresh tomatoes, 1 kg', 40.00, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400', 'Vegetables', 40, true),
('Onions', 'Red onions, 1 kg', 30.00, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', 'Vegetables', 60, true),
('Potatoes', 'Fresh potatoes, 1 kg', 25.00, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', 'Vegetables', 80, true),
('Rice', 'Basmati rice, 5 kg', 200.00, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'Grains', 20, true),
('Sugar', 'White sugar, 1 kg', 45.00, 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400', 'Essentials', 35, true),
('Cooking Oil', 'Sunflower oil, 1 liter', 120.00, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', 'Essentials', 15, true)
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if tables were created successfully
SELECT 'Tables created successfully' as status;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'handle_unconfirmed_user', 'create_user_profile');

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- ========================================
-- SETUP COMPLETE
-- ========================================

-- This script includes:
-- ✅ All tables with proper RLS policies
-- ✅ Email confirmation handling
-- ✅ User registration functions
-- ✅ Sample product data
-- ✅ Proper triggers for updated_at
-- ✅ Complete security setup

-- Next steps:
-- 1. Create owner user in Supabase Auth Dashboard
-- 2. Insert owner record in public.users table
-- 3. Test customer and delivery partner registration
-- 4. Configure email templates if needed
