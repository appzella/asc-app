-- Migration Script: Add 'cancelled' status to tours
-- Run this script in Supabase SQL Editor to add support for cancelled tours

-- Step 1: Update the status constraint to include 'cancelled'
ALTER TABLE public.tours DROP CONSTRAINT IF EXISTS tours_status_check;
ALTER TABLE public.tours ADD CONSTRAINT tours_status_check CHECK (status IN ('draft', 'published', 'cancelled'));

-- Step 2: Update RLS policy to allow viewing cancelled tours
DROP POLICY IF EXISTS "Everyone can view published tours" ON public.tours;
CREATE POLICY "Everyone can view published and cancelled tours"
  ON public.tours FOR SELECT
  USING (status IN ('published', 'cancelled') OR auth.uid() = leader_id OR auth.uid() = created_by);

-- Step 3: Recreate the view with explicit columns (including cancelled status)
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

