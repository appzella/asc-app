-- Migration Script: Update Tour Status from pending/approved/rejected to draft/published
-- Run this script in Supabase SQL Editor after updating the schema.sql

-- Step 1: Add submitted_for_publishing column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tours' AND column_name = 'submitted_for_publishing'
  ) THEN
    ALTER TABLE public.tours ADD COLUMN submitted_for_publishing BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Step 2: DROP the old status constraint FIRST (before updating values)
-- This allows us to update the status values without constraint violations
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Drop all check constraints that involve status
  FOR constraint_name IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.tours'::regclass 
    AND contype = 'c'
    AND (
      conname LIKE '%status%' 
      OR conname LIKE 'tours_status%'
    )
  LOOP
    EXECUTE 'ALTER TABLE public.tours DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;
END $$;

-- Step 3: Update status values (now without constraint)
-- Map 'approved' -> 'published', 'pending'/'rejected' -> 'draft'
UPDATE public.tours
SET status = CASE
  WHEN status = 'approved' THEN 'published'
  WHEN status IN ('pending', 'rejected') THEN 'draft'
  ELSE 'draft' -- fallback for any unexpected values
END
WHERE status NOT IN ('draft', 'published');

-- Step 4: Add the new constraint
ALTER TABLE public.tours ADD CONSTRAINT tours_status_check CHECK (status IN ('draft', 'published'));

-- Step 5: Drop and recreate the view with explicit columns
-- We need to DROP first because column changes require dropping the view
-- Note: Created without SECURITY DEFINER, so it uses SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.tours_with_participants CASCADE;

CREATE VIEW public.tours_with_participants AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.date,
  t.difficulty,
  t.tour_type,
  t.tour_length,
  t.elevation,
  t.duration,
  t.leader_id,
  t.max_participants,
  t.status,
  t.submitted_for_publishing,
  t.pending_changes,
  t.created_by,
  t.created_at,
  t.updated_at,
  COUNT(tp.user_id) as participant_count,
  array_agg(tp.user_id) FILTER (WHERE tp.user_id IS NOT NULL) as participant_ids
FROM public.tours t
LEFT JOIN public.tour_participants tp ON t.id = tp.tour_id
GROUP BY t.id;

-- Step 6: Remove rejection_comment column if it exists (optional, can be kept for history)
-- ALTER TABLE public.tours DROP COLUMN IF EXISTS rejection_comment;

