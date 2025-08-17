-- Setup Supabase Storage for Product Images
-- Run this in your Supabase SQL Editor

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);

-- Create storage policy to allow public read access to product images
CREATE POLICY "Allow public read access to product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Create storage policy to allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update product images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);

-- Create storage policy to allow authenticated users to delete their uploaded images
CREATE POLICY "Allow authenticated users to delete product images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);
