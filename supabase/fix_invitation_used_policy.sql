-- Migration: Allow updating invitations used status
-- Run this in Supabase SQL Editor

-- Allow authenticated users to update invitations (to mark as used during registration)
-- This is needed because the client-side registration marks the invitation as used
DROP POLICY IF EXISTS "Allow marking invitations as used" ON invitations;

CREATE POLICY "Allow marking invitations as used"
ON invitations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (used = true);  -- Only allow updating to used = true

-- Verify policy
SELECT * FROM pg_policies WHERE tablename = 'invitations';
