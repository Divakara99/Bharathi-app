-- Disable Email Confirmation Requirement
-- This script updates Supabase settings to allow users to sign in without email confirmation

-- Note: This should be done through the Supabase Dashboard, but here's the SQL approach
-- You'll need to run this in the Supabase SQL Editor

-- First, let's check the current auth settings
SELECT * FROM auth.config;

-- Update auth settings to disable email confirmation
-- Note: This might not work in all Supabase plans, so the dashboard approach is preferred

-- Alternative: Create a function to handle unconfirmed users
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
CREATE TRIGGER auto_confirm_user
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_unconfirmed_user();
