-- Migration: Add WhatsApp Group Link to Tours
-- Fügt ein optionales Feld für WhatsApp-Gruppen-Links zur tours Tabelle hinzu

-- Füge whatsapp_group_link Feld hinzu (optional, nullable)
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;

-- Kommentar hinzufügen
COMMENT ON COLUMN public.tours.whatsapp_group_link IS 'Optionaler Link zur WhatsApp-Gruppe für diese Tour';

