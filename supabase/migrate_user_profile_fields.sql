-- ASC Skiclub: Add Missing User Profile Fields
-- Adds address and mobile fields to users table
-- Run this in Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS mobile text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS zip text,
ADD COLUMN IF NOT EXISTS city text;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
