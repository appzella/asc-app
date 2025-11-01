-- Supabase Storage Setup für Profilbilder
-- WICHTIG: Erstelle zuerst den Bucket im Supabase Dashboard:
-- 1. Gehe zu Storage → Create new bucket
-- 2. Name: avatars
-- 3. Public: Ja (aktiviert)
-- 4. Dann führe dieses Script aus

-- 1. Lösche alle alten Policies für den avatars Bucket (falls vorhanden)
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;

-- 2. RLS Policies für den Bucket
-- Erlaube allen authentifizierten Usern, Profilbilder hochzuladen
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
);

-- Erlaube allen authentifizierten Usern, Profilbilder zu lesen
CREATE POLICY "Authenticated users can view profile photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
);

-- Erlaube Usern, ihre eigenen Profilbilder zu löschen
-- Pfad-Format: profile-photos/{userId}/{filename}
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name LIKE 'profile-photos/' || auth.uid()::text || '/%' OR name LIKE auth.uid()::text || '/%')
);

-- Erlaube Usern, ihre eigenen Profilbilder zu aktualisieren
-- Pfad-Format: profile-photos/{userId}/{filename}
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name LIKE 'profile-photos/' || auth.uid()::text || '/%' OR name LIKE auth.uid()::text || '/%')
);

