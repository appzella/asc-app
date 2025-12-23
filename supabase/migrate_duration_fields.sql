-- ASC Skiclub: Migrate Duration to DECIMAL Fields
-- Run this in Supabase SQL Editor

-- Add new decimal columns for duration
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS duration_min DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS duration_max DECIMAL(3,1);

-- Migrate existing data from duration string (e.g., "3-5 Stunden")
UPDATE public.tours 
SET 
    duration_min = CASE 
        WHEN duration ~ '(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)' 
        THEN (regexp_match(duration, '(\d+(?:\.\d+)?)'))[1]::DECIMAL
        WHEN duration ~ '(\d+(?:\.\d+)?)' 
        THEN (regexp_match(duration, '(\d+(?:\.\d+)?)'))[1]::DECIMAL
        ELSE 3.0
    END,
    duration_max = CASE 
        WHEN duration ~ '(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)' 
        THEN (regexp_match(duration, '-\s*(\d+(?:\.\d+)?)'))[1]::DECIMAL
        WHEN duration ~ '(\d+(?:\.\d+)?)' 
        THEN (regexp_match(duration, '(\d+(?:\.\d+)?)'))[1]::DECIMAL + 1
        ELSE 5.0
    END
WHERE duration IS NOT NULL;

-- Set defaults for NULL values
UPDATE public.tours 
SET duration_min = 3.0, duration_max = 5.0
WHERE duration_min IS NULL OR duration_max IS NULL;

-- Drop old duration text column
ALTER TABLE public.tours DROP COLUMN IF EXISTS duration;

-- Verify the migration
SELECT id, title, duration_min, duration_max FROM public.tours LIMIT 5;
