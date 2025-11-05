-- Migration: Fix foreign key constraints to allow user deletion
-- This migration fixes the invited_by foreign key constraint

-- Drop the existing foreign key constraint on invited_by
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_invited_by_fkey;

-- Recreate it with ON DELETE SET NULL
-- This allows deleting users even if they invited others
ALTER TABLE public.users
  ADD CONSTRAINT users_invited_by_fkey
  FOREIGN KEY (invited_by) 
  REFERENCES public.users(id) 
  ON DELETE SET NULL;

-- Also ensure the DELETE policy exists (if not already created by migration-add-user-delete-policy.sql)
-- Drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Create DELETE policy for admins
CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

