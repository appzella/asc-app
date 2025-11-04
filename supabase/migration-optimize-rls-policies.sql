-- Migration: Optimize RLS Policies for Performance
-- Fixes auth_rls_initplan and multiple_permissive_policies warnings
-- Run this in Supabase SQL Editor

-- ============================================
-- USERS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view other users (for tour participants)" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

-- Create optimized policies with (select auth.uid()) and combined where possible
-- Combined SELECT policy for users (all authenticated users can view all users)
CREATE POLICY "Users can view profiles"
  ON public.users FOR SELECT
  USING (true);

-- Combined UPDATE policy for users
CREATE POLICY "Users can update profiles"
  ON public.users FOR UPDATE
  USING (
    (select auth.uid()) = id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- INSERT policy for admins
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- TOURS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view published and cancelled tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can view all tours" ON public.tours;
DROP POLICY IF EXISTS "Leaders and admins can create tours" ON public.tours;
DROP POLICY IF EXISTS "Leaders can update their own tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can update any tour" ON public.tours;
DROP POLICY IF EXISTS "Admins can delete tours" ON public.tours;

-- Combined SELECT policy for tours
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

-- INSERT policy for leaders and admins
CREATE POLICY "Leaders and admins can create tours"
  ON public.tours FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role IN ('admin', 'leader')
    )
  );

-- Combined UPDATE policy for tours
CREATE POLICY "Leaders and admins can update tours"
  ON public.tours FOR UPDATE
  USING (
    (select auth.uid()) = leader_id OR
    (select auth.uid()) = created_by OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- DELETE policy for admins
CREATE POLICY "Admins can delete tours"
  ON public.tours FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- TOUR_PARTICIPANTS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all tour participants" ON public.tour_participants;
DROP POLICY IF EXISTS "Users can join tours" ON public.tour_participants;
DROP POLICY IF EXISTS "Users can leave tours" ON public.tour_participants;
DROP POLICY IF EXISTS "Admins can manage all participants" ON public.tour_participants;

-- Combined SELECT policy
CREATE POLICY "Users can view tour participants"
  ON public.tour_participants FOR SELECT
  USING (true);

-- Combined INSERT policy
CREATE POLICY "Users and admins can join tours"
  ON public.tour_participants FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Combined DELETE policy
CREATE POLICY "Users and admins can leave tours"
  ON public.tour_participants FOR DELETE
  USING (
    (select auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- CHAT_MESSAGES TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages for tours they participate in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to tours they participate in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON public.chat_messages;

-- SELECT policy
CREATE POLICY "Users can view messages for tours they participate in"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_participants
      WHERE tour_id = chat_messages.tour_id AND user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.tours
      WHERE id = chat_messages.tour_id AND leader_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- INSERT policy
CREATE POLICY "Users can send messages to tours they participate in"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id AND (
      EXISTS (
        SELECT 1 FROM public.tour_participants
        WHERE tour_id = chat_messages.tour_id AND user_id = (select auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.tours
        WHERE id = chat_messages.tour_id AND leader_id = (select auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (select auth.uid()) AND role = 'admin'
      )
    )
  );

-- Combined DELETE policy
CREATE POLICY "Users and admins can delete messages"
  ON public.chat_messages FOR DELETE
  USING (
    (select auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- INVITATIONS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;

-- All admin policies (already combined by role, just need to fix auth.uid())
CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
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

-- ============================================
-- TOUR_SETTINGS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view tour settings" ON public.tour_settings;
DROP POLICY IF EXISTS "Admins can manage tour settings" ON public.tour_settings;

-- Combined SELECT policy
CREATE POLICY "Users can view tour settings"
  ON public.tour_settings FOR SELECT
  USING (true);

-- Admin management policy (separate for UPDATE/INSERT/DELETE)
CREATE POLICY "Admins can manage tour settings"
  ON public.tour_settings FOR ALL
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

