-- Migration: GPX-Datei Support für Touren
-- Fügt ein gpx_file Feld zur tours Tabelle hinzu

ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS gpx_file TEXT;

COMMENT ON COLUMN public.tours.gpx_file IS 'URL zur GPX-Datei in Supabase Storage (gpx-files bucket)';

