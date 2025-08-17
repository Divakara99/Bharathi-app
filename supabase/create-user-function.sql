-- Create a function to handle user registration that bypasses RLS
-- This is an alternative approach if the RLS policies still cause issues

-- Function to create a new user with proper role assignment
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_role TEXT DEFAULT 'customer'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
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

-- Create a trigger to automatically create user profile when auth.users is created
-- This is an alternative approach that doesn't require manual function calls
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into users table with default role 'customer'
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'customer');
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create the trigger (uncomment if you want automatic user creation)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION handle_new_user();
