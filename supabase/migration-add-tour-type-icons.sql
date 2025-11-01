-- Migration: Add icon_name to tour_settings for tour types
-- Fügt ein Feld hinzu, um Icon-Namen für Tourentypen zu speichern

ALTER TABLE public.tour_settings 
ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- Standard-Icons für bestehende Tourenarten setzen
UPDATE public.tour_settings 
SET icon_name = CASE setting_key
  WHEN 'Wanderung' THEN 'Mountain'
  WHEN 'Skitour' THEN 'Ski'
  WHEN 'Bike' THEN 'Bike'
  ELSE NULL
END
WHERE setting_type = 'tour_type' AND icon_name IS NULL;

