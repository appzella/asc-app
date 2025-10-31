-- Database Function: Automatically create user profile when auth user is created
-- This function is triggered by a database trigger

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'member';
  user_name TEXT := '';
BEGIN
  -- Extract role and name from metadata if available
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  END IF;

  -- Insert user profile into public.users
  INSERT INTO public.users (id, email, name, role, registered, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role::text,
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.users.name),
        role = COALESCE(EXCLUDED.role, public.users.role),
        updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger: Call function when new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

