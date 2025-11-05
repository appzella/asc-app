-- Migration: Allow reading invitations by token for registration
-- This allows non-authenticated users to read an invitation by token to register
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist (from schema.sql or migration-optimize-rls-policies.sql)
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can read unused invitations" ON public.invitations;

-- Add a policy that allows reading invitations by token (for registration)
-- This needs to work for non-authenticated users, so we check used = false
CREATE POLICY "Anyone can read unused invitations"
  ON public.invitations FOR SELECT
  USING (used = false);

-- Recreate admin policy for managing invitations (INSERT, UPDATE, DELETE)
-- This policy allows admins to manage invitations (create, update, delete)
CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policy for viewing all invitations (including used ones)
-- This is separate because SELECT needs to work with the "Anyone can read unused invitations" policy
CREATE POLICY "Admins can view all invitations"
  ON public.invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Note: The "Anyone can read unused invitations" policy allows anyone 
-- (authenticated or not) to read invitations that are not yet used. 
-- This is necessary for the registration flow where users need to verify 
-- their invitation token before registering.
-- The used = false check ensures that already-used invitations cannot be read by non-admins.
-- Admins can still view all invitations (including used ones) via the second policy.

