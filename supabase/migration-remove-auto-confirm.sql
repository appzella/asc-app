-- Migration: Remove auto-confirm for invited users
-- All users (invited and non-invited) must confirm their email before logging in
-- Run this in Supabase SQL Editor

-- Drop the auto-confirm trigger
DROP TRIGGER IF EXISTS on_user_created_auto_confirm ON public.users;

-- Drop the auto-confirm function (optional, can be kept for future use)
-- Uncomment if you want to completely remove it:
-- DROP FUNCTION IF EXISTS public.auto_confirm_invited_user();

-- Note: The function is kept for potential future use, but the trigger is removed
-- This means invited users will no longer be auto-confirmed and must confirm their email
-- just like non-invited users

