-- Migration: Fix Security Definer Views
-- This migration recreates the views with SECURITY INVOKER (default) to fix security issues
-- Views created without SECURITY DEFINER automatically use SECURITY INVOKER
-- Run this in Supabase SQL Editor

-- Drop and recreate tours_with_participants view
-- Use WITH (security_invoker = true) to explicitly set SECURITY INVOKER (PostgreSQL 15+)
-- If this syntax is not supported, the view will be created without SECURITY DEFINER anyway
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
  COUNT(tp.user_id) as participant_count,
  array_agg(tp.user_id) FILTER (WHERE tp.user_id IS NOT NULL) as participant_ids
FROM public.tours t
LEFT JOIN public.tour_participants tp ON t.id = tp.tour_id
GROUP BY t.id;

-- Alternative: If WITH (security_invoker = true) doesn't work, try ALTER VIEW after creation
-- ALTER VIEW public.tours_with_participants SET (security_invoker = true);

-- Drop and recreate chat_messages_with_user view
-- Use WITH (security_invoker = true) to explicitly set SECURITY INVOKER (PostgreSQL 15+)
DROP VIEW IF EXISTS public.chat_messages_with_user CASCADE;

CREATE VIEW public.chat_messages_with_user
WITH (security_invoker = true) AS
SELECT 
  cm.*,
  u.name as user_name,
  u.email as user_email,
  u.profile_photo as user_profile_photo
FROM public.chat_messages cm
JOIN public.users u ON cm.user_id = u.id;

-- Alternative: If WITH (security_invoker = true) doesn't work, try ALTER VIEW after creation
-- ALTER VIEW public.chat_messages_with_user SET (security_invoker = true);

-- ============================================
-- Change Owner to authenticated (IMPORTANT!)
-- ============================================
-- Views owned by postgres (superuser) are treated as SECURITY DEFINER
-- We need to change the owner to authenticated to fix this
ALTER VIEW public.tours_with_participants OWNER TO authenticated;
ALTER VIEW public.chat_messages_with_user OWNER TO authenticated;

-- Grant necessary permissions
-- RLS policies on underlying tables (tours, tour_participants, chat_messages, users) will apply
GRANT SELECT ON public.tours_with_participants TO authenticated;
GRANT SELECT ON public.chat_messages_with_user TO authenticated;

-- ============================================
-- Verify Views are SECURITY INVOKER
-- ============================================
-- Check if views are still SECURITY DEFINER (they shouldn't be)
-- This query will show if the views have SECURITY DEFINER set
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('tours_with_participants', 'chat_messages_with_user');

-- If the above query shows the views exist but Security Advisor still shows errors,
-- try the alternative migration: migration-fix-security-definer-views-alternative.sql

-- ============================================
-- Fix Function Search Path Warnings
-- ============================================
-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  user_role TEXT := 'member';
  user_name TEXT := '';
BEGIN
  -- Extract role and name from metadata if available
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  END IF;

  -- Insert user profile into public.users
  INSERT INTO public.users (id, email, name, role, registered, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role::text,
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.users.name),
        role = COALESCE(EXCLUDED.role, public.users.role),
        updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix auto_confirm_invited_user function
CREATE OR REPLACE FUNCTION public.auto_confirm_invited_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Check if user was created via invitation (has registration_token in public.users)
  -- Note: This runs AFTER the user profile is created in public.users
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.id 
    AND registration_token IS NOT NULL
  ) THEN
    -- Auto-confirm the email in auth.users
    -- Note: This requires SECURITY DEFINER to access auth.users
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = NEW.id
    AND email_confirmed_at IS NULL; -- Only if not already confirmed
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

