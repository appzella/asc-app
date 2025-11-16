-- Migration: Füge whatsapp_group_link Feld zur tours_with_participants View hinzu
-- Diese Migration muss nach migration-add-whatsapp-group-link.sql ausgeführt werden

DROP VIEW IF EXISTS public.tours_with_participants CASCADE;

CREATE VIEW public.tours_with_participants
WITH (security_invoker = true) AS
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
  t.gpx_file,
  t.whatsapp_group_link,
  COUNT(tp.user_id) as participant_count,
  array_agg(tp.user_id) FILTER (WHERE tp.user_id IS NOT NULL) as participant_ids
FROM public.tours t
LEFT JOIN public.tour_participants tp ON t.id = tp.tour_id
GROUP BY t.id;

-- Grant permissions
GRANT SELECT ON public.tours_with_participants TO authenticated;

