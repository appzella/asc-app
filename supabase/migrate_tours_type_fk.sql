-- ASC Skiclub: Tours Type Foreign Key Migration
-- Adds a proper foreign key relationship between tours.type and tour_types.name
-- Run this in Supabase SQL Editor

-- Step 1: Add unique constraint on tour_types.name (required for foreign key)
ALTER TABLE public.tour_types
ADD CONSTRAINT tour_types_name_unique UNIQUE (name);

-- Step 2: Update any tours with mismatched type values to match tour_types.name
-- (Maps label values to name values if they don't match)
UPDATE public.tours t
SET type = tt.name
FROM public.tour_types tt
WHERE t.type = tt.label AND t.type != tt.name;

-- Step 3: Add foreign key constraint
ALTER TABLE public.tours
ADD CONSTRAINT fk_tours_type
FOREIGN KEY (type) REFERENCES public.tour_types(name)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- Verify: Show tours with their tour type label
SELECT t.id, t.title, t.type, tt.label 
FROM public.tours t 
JOIN public.tour_types tt ON t.type = tt.name
LIMIT 5;
