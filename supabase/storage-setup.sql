-- Supabase Storage Setup für Profilbilder
-- Führe dieses Script im SQL Editor von Supabase aus

-- 1. Erstelle einen Storage Bucket für Profilbilder
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies für den Bucket
-- Erlaube allen authentifizierten Usern, Profilbilder hochzuladen
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Erlaube allen authentifizierten Usern, Profilbilder zu lesen
CREATE POLICY "Authenticated users can view profile photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Erlaube Usern, ihre eigenen Profilbilder zu löschen
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Erlaube Usern, ihre eigenen Profilbilder zu aktualisieren
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

