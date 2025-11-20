-- Performance Optimizations
-- Created based on schema analysis

-- 1. Indexes for Performance
-- Optimize sorting tours by date (used in getTours)
CREATE INDEX IF NOT EXISTS idx_tours_date ON public.tours (date);

-- Optimize filtering by status and sorting (used in getPublishedTours, getDraftTours)
CREATE INDEX IF NOT EXISTS idx_tours_status_created_at ON public.tours (status, created_at DESC);

-- Optimize foreign key lookups for participants
CREATE INDEX IF NOT EXISTS idx_tour_participants_tour_id ON public.tour_participants (tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_participants_user_id ON public.tour_participants (user_id);

-- Optimize foreign key lookups for waitlist
CREATE INDEX IF NOT EXISTS idx_tour_waitlist_tour_id ON public.tour_waitlist (tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_waitlist_user_id ON public.tour_waitlist (user_id);

-- Optimize sorting settings
CREATE INDEX IF NOT EXISTS idx_tour_settings_display_order ON public.tour_settings (display_order);

-- 2. Constraints for Data Integrity
-- Prevent a user from signing up for the same tour twice
ALTER TABLE public.tour_participants 
ADD CONSTRAINT tour_participants_tour_user_unique UNIQUE (tour_id, user_id);

-- Prevent a user from being on the waitlist twice
ALTER TABLE public.tour_waitlist 
ADD CONSTRAINT tour_waitlist_tour_user_unique UNIQUE (tour_id, user_id);
