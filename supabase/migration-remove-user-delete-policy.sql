-- Migration: Remove user delete policy (no longer needed)
-- Since we removed the delete functionality from the UI and repositories,
-- we can remove the DELETE policy from the users table
-- Run this in Supabase SQL Editor

-- Remove the DELETE policy for users table
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Note: The foreign key constraints (ON DELETE CASCADE, ON DELETE SET NULL) remain
-- as they are still useful for database integrity, even if we don't use DELETE
-- operations in the application code.

