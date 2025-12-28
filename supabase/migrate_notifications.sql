-- Migration: Add link field to notifications table
-- Run this in Supabase SQL Editor

-- Add link column if not exists
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;

-- Add insert policy for authenticated users (needed for creating notifications)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'System can create notifications'
  ) THEN
    CREATE POLICY "System can create notifications"
      ON public.notifications FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
