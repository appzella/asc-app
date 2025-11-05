-- Migration: Warteliste für Tourenanmeldungen
-- Erstellt die tour_waitlist Tabelle mit RLS Policies

-- ============================================
-- TOUR_WAITLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tour_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tour_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tour_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tour_waitlist
CREATE POLICY "Users can view all waitlist entries"
  ON public.tour_waitlist FOR SELECT
  USING (true);

CREATE POLICY "Users can add themselves to waitlist"
  ON public.tour_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from waitlist"
  ON public.tour_waitlist FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders can manage waitlist for their tours"
  ON public.tour_waitlist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tours
      WHERE id = tour_waitlist.tour_id AND leader_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all waitlist entries"
  ON public.tour_waitlist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tour_waitlist_tour_id ON public.tour_waitlist(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_waitlist_user_id ON public.tour_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_waitlist_created_at ON public.tour_waitlist(created_at);

