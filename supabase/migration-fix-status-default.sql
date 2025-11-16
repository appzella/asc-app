-- Migration: Fix Status Default Value
-- Korrigiert den DEFAULT-Wert für status von 'pending' zu 'draft'

-- Ändere den DEFAULT-Wert für status
ALTER TABLE public.tours 
ALTER COLUMN status SET DEFAULT 'draft';

-- Kommentar hinzufügen
COMMENT ON COLUMN public.tours.status IS 'Status der Tour: draft (Entwurf), published (Veröffentlicht), cancelled (Abgesagt)';

