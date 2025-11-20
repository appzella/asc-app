-- Remove hardcoded CHECK constraints to allow dynamic configuration via tour_settings
-- The application uses the tour_settings table to manage these values dynamically.

-- Drop check constraint for tour_type
ALTER TABLE public.tours DROP CONSTRAINT IF EXISTS tours_tour_type_check;

-- Drop check constraint for tour_length
ALTER TABLE public.tours DROP CONSTRAINT IF EXISTS tours_tour_length_check;

-- Drop check constraint for difficulty
ALTER TABLE public.tours DROP CONSTRAINT IF EXISTS tours_difficulty_check;
