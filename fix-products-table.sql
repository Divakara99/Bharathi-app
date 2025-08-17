-- Fix products table - add missing stock column
-- Run this in your Supabase SQL Editor

-- Add missing stock column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

-- Add missing is_active column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing products to have stock
UPDATE public.products 
SET stock = 100 
WHERE stock IS NULL;

-- Update existing products to be active
UPDATE public.products 
SET is_active = true 
WHERE is_active IS NULL;

-- Insert sample products (only if they don't exist)
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
