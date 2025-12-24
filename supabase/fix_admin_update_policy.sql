-- Fix: Allow admins to update other users
-- Run this in Supabase SQL Editor

-- Drop the old policy
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

-- Create new policies: users can update own record, admins can update anyone
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Trigger function to ensure at least one admin always exists
CREATE OR REPLACE FUNCTION public.check_last_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Only check if role is being changed from admin to something else
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    SELECT COUNT(*) INTO admin_count 
    FROM public.users 
    WHERE role = 'admin' AND id != OLD.id;
    
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Es muss mindestens ein Administrator existieren.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS ensure_admin_exists ON public.users;
CREATE TRIGGER ensure_admin_exists
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.check_last_admin();
