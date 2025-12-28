-- Add user settings columns to users table
-- Run this in Supabase SQL Editor

-- Add settings columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.users.theme IS 'User preferred theme: light, dark, or system';
COMMENT ON COLUMN public.users.email_notifications IS 'Whether user wants email notifications';
COMMENT ON COLUMN public.users.push_notifications IS 'Whether user wants push notifications';
