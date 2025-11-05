-- Migration: Allow users to create their own profile
-- This is needed as a fallback if the trigger fails
-- Run this in Supabase SQL Editor

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Policy for admins to insert users
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for users to insert their own profile
-- This is needed as a fallback if the trigger fails
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: The trigger should normally create the profile automatically,
-- but this policy allows users to create their own profile as a fallback
-- if the trigger fails for any reason.

