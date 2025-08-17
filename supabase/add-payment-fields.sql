-- Add Payment Fields to Orders Table
-- This script adds payment-related columns to track payment method and status

-- Add payment method and status columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'pending')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS payment_collected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_collected_by UUID REFERENCES public.users(id);

-- Update existing orders to have default payment values
UPDATE public.orders 
SET payment_method = 'pending', 
    payment_status = 'pending' 
WHERE payment_method IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);

-- Add RLS policy for payment collection
CREATE POLICY IF NOT EXISTS "Delivery partners can update payment status" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.delivery_partners 
            WHERE user_id = auth.uid() AND id = delivery_partner_id
        )
    );

-- Verify the changes
SELECT 'Payment fields added successfully' as status;
