-- Migration: Add active field to users table
-- Allows deactivating users without deleting them

-- Add active column (default true for existing users)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Create index for better performance when filtering active users
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(active);

-- Update comment
COMMENT ON COLUMN public.users.active IS 'Whether the user account is active. Deactivated users cannot log in but their data is preserved.';

