-- Supabase Storage Setup für GPX-Dateien
-- WICHTIG: Erstelle zuerst den Bucket im Supabase Dashboard:
-- 1. Gehe zu Storage → Create new bucket
-- 2. Name: gpx-files
-- 3. Public: Ja (aktiviert)
-- 4. File size limit: 10MB (10485760 bytes)
-- 5. Allowed MIME types: application/gpx+xml, application/xml, text/xml (optional)
-- 6. Dann führe dieses Script aus

-- 1. Lösche alle alten Policies für den gpx-files Bucket (falls vorhanden)
DROP POLICY IF EXISTS "Users can upload GPX files for tours" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view GPX files" ON storage.objects;
DROP POLICY IF EXISTS "Leaders can delete their own GPX files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any GPX file" ON storage.objects;

-- 2. RLS Policies für den Bucket
-- Erlaube Leaders und Admins, GPX-Dateien hochzuladen
CREATE POLICY "Users can upload GPX files for tours"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gpx-files' AND
  (
    -- Nur Leaders und Admins können hochladen
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'leader')
    )
  )
);

-- Erlaube allen authentifizierten Usern, GPX-Dateien zu lesen
CREATE POLICY "Authenticated users can view GPX files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gpx-files'
);

-- Erlaube Leaders, ihre eigenen GPX-Dateien zu löschen
-- Pfad-Format: gpx/{tourId}/{filename}
CREATE POLICY "Leaders can delete their own GPX files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gpx-files' AND
  (
    -- Prüfe ob der User Leader der Tour ist
    EXISTS (
      SELECT 1 FROM public.tours
      WHERE gpx_file LIKE '%' || (storage.foldername(name))[1] || '%'
      AND leader_id = auth.uid()
    )
    OR
    -- Prüfe ob der User die Tour erstellt hat
    EXISTS (
      SELECT 1 FROM public.tours
      WHERE gpx_file LIKE '%' || (storage.foldername(name))[1] || '%'
      AND created_by = auth.uid()
    )
  )
);

-- Erlaube Admins, alle GPX-Dateien zu löschen
CREATE POLICY "Admins can delete any GPX file"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gpx-files' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

