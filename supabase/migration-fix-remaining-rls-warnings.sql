-- Migration: Fix Remaining RLS Performance Warnings
-- Fixes remaining auth_rls_initplan and multiple_permissive_policies warnings
-- Run this in Supabase SQL Editor

-- ============================================
-- Fix tours table
-- ============================================
-- Drop old policy that might still exist
DROP POLICY IF EXISTS "Everyone can view approved tours" ON public.tours;

-- Ensure the current policy uses (select auth.uid())
-- First check if policy exists and drop it
DROP POLICY IF EXISTS "Users can view tours" ON public.tours;

-- Recreate with optimized auth.uid()
CREATE POLICY "Users can view tours"
  ON public.tours FOR SELECT
  USING (
    status IN ('published', 'cancelled') OR
    (select auth.uid()) = leader_id OR
    (select auth.uid()) = created_by OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- Fix tour_settings table
-- ============================================
-- The problem: "Admins can manage tour settings" uses FOR ALL which includes SELECT
-- This conflicts with "Users can view tour settings" for SELECT action
-- Solution: Separate SELECT from other operations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tour settings" ON public.tour_settings;
DROP POLICY IF EXISTS "Admins can manage tour settings" ON public.tour_settings;

-- SELECT policy (for everyone)
CREATE POLICY "Users can view tour settings"
  ON public.tour_settings FOR SELECT
  USING (true);

-- Admin management policies (separate for INSERT, UPDATE, DELETE - NOT SELECT)
CREATE POLICY "Admins can insert tour settings"
  ON public.tour_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update tour settings"
  ON public.tour_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tour settings"
  ON public.tour_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

