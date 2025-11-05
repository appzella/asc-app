-- Migration: Improve auto-confirm for invited users
-- This makes the auto-confirm trigger work immediately after signUp
-- Run this in Supabase SQL Editor

-- Improve the handle_new_user function to set registration_token from metadata if available
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  user_role TEXT := 'member';
  user_name TEXT := '';
  registration_token TEXT := NULL;
BEGIN
  -- Extract role, name, and registration_token from metadata if available
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
    registration_token := NEW.raw_user_meta_data->>'registration_token';
  END IF;

  -- Insert user profile into public.users
  -- Check if active column exists by trying to insert with it
  -- If it doesn't exist, the trigger will still work without it
  BEGIN
    -- Try to insert with active field (if column exists)
    INSERT INTO public.users (id, email, name, role, registered, active, registration_token, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(user_name, COALESCE(NEW.email, ''), 'User'),
      user_role::text,
      true,
      true,
      registration_token,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
      SET name = COALESCE(EXCLUDED.name, public.users.name),
          role = COALESCE(EXCLUDED.role, public.users.role),
          email = COALESCE(EXCLUDED.email, public.users.email),
          registration_token = COALESCE(EXCLUDED.registration_token, public.users.registration_token),
          updated_at = NOW();
  EXCEPTION WHEN undefined_column THEN
    -- If active column doesn't exist, insert without it
    INSERT INTO public.users (id, email, name, role, registered, registration_token, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(user_name, COALESCE(NEW.email, ''), 'User'),
      user_role::text,
      true,
      registration_token,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
      SET name = COALESCE(EXCLUDED.name, public.users.name),
          role = COALESCE(EXCLUDED.role, public.users.role),
          email = COALESCE(EXCLUDED.email, public.users.email),
          registration_token = COALESCE(EXCLUDED.registration_token, public.users.registration_token),
          updated_at = NOW();
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The auto_confirm_invited_user trigger will now run immediately
-- after the profile is created with registration_token, confirming the email

