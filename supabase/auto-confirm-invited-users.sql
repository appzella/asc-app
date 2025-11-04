-- Auto-confirm users who register via invitation
-- This prevents the need for email confirmation when using the invitation system

-- Function to auto-confirm invited users
CREATE OR REPLACE FUNCTION public.auto_confirm_invited_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Check if user was created via invitation (has registration_token in public.users)
  -- Note: This runs AFTER the user profile is created in public.users
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.id 
    AND registration_token IS NOT NULL
  ) THEN
    -- Auto-confirm the email in auth.users
    -- Note: This requires SECURITY DEFINER to access auth.users
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = NEW.id
    AND email_confirmed_at IS NULL; -- Only if not already confirmed
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_created_auto_confirm ON public.users;

-- Create trigger: Auto-confirm after user profile is created
CREATE TRIGGER on_user_created_auto_confirm
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  WHEN (NEW.registration_token IS NOT NULL)
  EXECUTE FUNCTION public.auto_confirm_invited_user();

