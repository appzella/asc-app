-- Alternative Migration: Fix Security Definer Views
-- Use this if the WITH (security_invoker = true) syntax doesn't work
-- This approach uses a more explicit method to ensure SECURITY INVOKER

-- Step 1: Completely drop all dependent objects first
DROP VIEW IF EXISTS public.tours_with_participants CASCADE;
DROP VIEW IF EXISTS public.chat_messages_with_user CASCADE;

-- Step 2: Recreate tours_with_participants view
-- Make sure to create it as the authenticated user (not as a superuser)
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

-- Step 3: Recreate chat_messages_with_user view
CREATE VIEW public.chat_messages_with_user AS
SELECT 
  cm.*,
  u.name as user_name,
  u.email as user_email,
  u.profile_photo as user_profile_photo
FROM public.chat_messages cm
JOIN public.users u ON cm.user_id = u.id;

-- Step 4: CRITICAL - Change ownership to authenticated role
-- Views owned by postgres (superuser) are automatically treated as SECURITY DEFINER
-- Changing owner to authenticated fixes the security issue
ALTER VIEW public.tours_with_participants OWNER TO authenticated;
ALTER VIEW public.chat_messages_with_user OWNER TO authenticated;

-- Step 5: Grant permissions
GRANT SELECT ON public.tours_with_participants TO authenticated;
GRANT SELECT ON public.chat_messages_with_user TO authenticated;

-- Step 6: Verify the views are not SECURITY DEFINER
-- You can check this with:
-- SELECT relname, relkind, reloptions FROM pg_class 
-- WHERE relname IN ('tours_with_participants', 'chat_messages_with_user');

