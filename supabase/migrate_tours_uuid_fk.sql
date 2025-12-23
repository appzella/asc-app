-- ASC Skiclub: Complete Tours UUID Migration
-- Migrates tours from text-based references to proper UUID foreign keys
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Add unique constraint on tour_lengths.name
-- ============================================
ALTER TABLE public.tour_lengths
ADD CONSTRAINT tour_lengths_name_unique UNIQUE (name);

-- ============================================
-- STEP 2: Add new UUID columns to tours table
-- ============================================
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS tour_type_id uuid,
ADD COLUMN IF NOT EXISTS tour_length_id uuid,
ADD COLUMN IF NOT EXISTS difficulty_id uuid;

-- ============================================
-- STEP 3: Populate tour_type_id from existing type field
-- ============================================
UPDATE public.tours t
SET tour_type_id = tt.id
FROM public.tour_types tt
WHERE t.type = tt.name;

-- ============================================
-- STEP 4: Populate tour_length_id from existing length field
-- ============================================
UPDATE public.tours t
SET tour_length_id = tl.id
FROM public.tour_lengths tl
WHERE t.length = tl.name;

-- ============================================
-- STEP 5: Populate difficulty_id from existing difficulty field
-- (Join through tour_type to find the correct difficulty)
-- ============================================
UPDATE public.tours t
SET difficulty_id = td.id
FROM public.tour_difficulties td
WHERE t.tour_type_id = td.tour_type_id 
  AND t.difficulty = td.name;

-- ============================================
-- STEP 6: Add foreign key constraints
-- ============================================
ALTER TABLE public.tours
ADD CONSTRAINT fk_tours_tour_type_id
FOREIGN KEY (tour_type_id) REFERENCES public.tour_types(id)
ON DELETE RESTRICT;

ALTER TABLE public.tours
ADD CONSTRAINT fk_tours_tour_length_id
FOREIGN KEY (tour_length_id) REFERENCES public.tour_lengths(id)
ON DELETE RESTRICT;

ALTER TABLE public.tours
ADD CONSTRAINT fk_tours_difficulty_id
FOREIGN KEY (difficulty_id) REFERENCES public.tour_difficulties(id)
ON DELETE RESTRICT;

-- ============================================
-- STEP 7: Drop old foreign key constraint (if exists)
-- ============================================
ALTER TABLE public.tours 
DROP CONSTRAINT IF EXISTS fk_tours_type;

-- ============================================
-- STEP 8: Drop old text columns
-- ============================================
ALTER TABLE public.tours 
DROP COLUMN IF EXISTS type,
DROP COLUMN IF EXISTS difficulty,
DROP COLUMN IF EXISTS length;

-- ============================================
-- VERIFY: Check the migration worked
-- ============================================
SELECT 
    t.id,
    t.title,
    tt.label as tour_type,
    tl.label as tour_length,
    td.name as difficulty
FROM public.tours t
LEFT JOIN public.tour_types tt ON t.tour_type_id = tt.id
LEFT JOIN public.tour_lengths tl ON t.tour_length_id = tl.id
LEFT JOIN public.tour_difficulties td ON t.difficulty_id = td.id
LIMIT 5;
