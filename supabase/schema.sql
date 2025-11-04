-- ASC Skitouren App - Supabase Schema
-- Migration: lib/types.ts → Supabase Tabellen mit Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Note: Supabase Auth users are stored in auth.users
-- This table extends auth.users with app-specific data

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'leader', 'member')),
  invited_by UUID REFERENCES public.users(id),
  registration_token TEXT,
  registered BOOLEAN DEFAULT false,
  profile_photo TEXT, -- URL to image in Supabase Storage (avatars bucket) or Base64 (legacy)
  phone TEXT, -- Festnetz
  mobile TEXT, -- Mobiltelefon
  street TEXT,
  zip TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view other users (for tour participants)"
  ON public.users FOR SELECT
  USING (true); -- All authenticated users can view other users

CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TOURS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN (
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6', -- Wanderungen
    'L', 'WS', 'ZS', 'S', 'SS', 'AS', 'EX', -- Skitouren
    'B1', 'B2', 'B3', 'B4', 'B5' -- Bike
  )),
  tour_type TEXT NOT NULL CHECK (tour_type IN ('Wanderung', 'Skitour', 'Bike')),
  tour_length TEXT NOT NULL CHECK (tour_length IN ('Eintagestour', 'Mehrtagestour')),
  elevation INTEGER NOT NULL,
  duration INTEGER NOT NULL, -- Dauer in Stunden
  leader_id UUID NOT NULL REFERENCES public.users(id),
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  submitted_for_publishing BOOLEAN DEFAULT FALSE,
  pending_changes JSONB, -- Ausstehende Änderungen, die auf Freigabe warten
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tours
CREATE POLICY "Everyone can view published and cancelled tours"
  ON public.tours FOR SELECT
  USING (status IN ('published', 'cancelled') OR auth.uid() = leader_id OR auth.uid() = created_by);

CREATE POLICY "Admins can view all tours"
  ON public.tours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Leaders and admins can create tours"
  ON public.tours FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'leader')
    )
  );

CREATE POLICY "Leaders can update their own tours"
  ON public.tours FOR UPDATE
  USING (auth.uid() = leader_id OR auth.uid() = created_by);

CREATE POLICY "Admins can update any tour"
  ON public.tours FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tours"
  ON public.tours FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TOUR_PARTICIPANTS TABLE (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tour_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tour_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tour_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tour_participants
CREATE POLICY "Users can view all tour participants"
  ON public.tour_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join tours"
  ON public.tour_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave tours"
  ON public.tour_participants FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all participants"
  ON public.tour_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- CHAT_MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages for tours they participate in"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_participants
      WHERE tour_id = chat_messages.tour_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tours
      WHERE id = chat_messages.tour_id AND leader_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can send messages to tours they participate in"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM public.tour_participants
        WHERE tour_id = chat_messages.tour_id AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.tours
        WHERE id = chat_messages.tour_id AND leader_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any message"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Admins can view all invitations"
  ON public.invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TOUR_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tour_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_type TEXT NOT NULL CHECK (setting_type IN ('tour_type', 'tour_length', 'difficulty')),
  setting_key TEXT NOT NULL, -- e.g., 'Wanderung', 'Eintagestour', 'T1'
  setting_value TEXT, -- For difficulties, this could be the tour_type (e.g., 'Wanderung')
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setting_type, setting_key, setting_value)
);

-- Enable RLS
ALTER TABLE public.tour_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tour_settings
CREATE POLICY "Everyone can view tour settings"
  ON public.tour_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tour settings"
  ON public.tour_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_date ON public.tours(date);
CREATE INDEX IF NOT EXISTS idx_tours_leader_id ON public.tours(leader_id);
CREATE INDEX IF NOT EXISTS idx_tour_participants_tour_id ON public.tour_participants(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_participants_user_id ON public.tour_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tour_id ON public.chat_messages(tour_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- ============================================
-- FUNCTIONS
-- ============================================
-- Function to update updated_at timestamp
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

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_settings_updated_at
  BEFORE UPDATE ON public.tour_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (for easier queries)
-- ============================================
-- View for tours with participant count
-- Note: Explicitly set SECURITY INVOKER using WITH (security_invoker = true)
-- This ensures RLS policies are enforced with the querying user's permissions
CREATE OR REPLACE VIEW public.tours_with_participants
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

-- Grant permissions
GRANT SELECT ON public.tours_with_participants TO authenticated;

-- View for chat messages with user info
-- Note: Explicitly set SECURITY INVOKER using WITH (security_invoker = true)
-- This ensures RLS policies are enforced with the querying user's permissions
CREATE OR REPLACE VIEW public.chat_messages_with_user
WITH (security_invoker = true) AS
SELECT 
  cm.*,
  u.name as user_name,
  u.email as user_email,
  u.profile_photo as user_profile_photo
FROM public.chat_messages cm
JOIN public.users u ON cm.user_id = u.id;

-- Grant permissions
GRANT SELECT ON public.chat_messages_with_user TO authenticated;

