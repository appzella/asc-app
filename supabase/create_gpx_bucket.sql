-- ASC Skiclub: Create GPX Files Storage Bucket
-- Run this in Supabase SQL Editor

-- Create the bucket for GPX files
INSERT INTO storage.buckets (id, name, public)
VALUES ('gpx-files', 'gpx-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload GPX files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gpx-files');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update GPX files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gpx-files');

-- Allow authenticated users to delete GPX files
CREATE POLICY "Authenticated users can delete GPX files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gpx-files');

-- Allow public read access (for displaying on map)
CREATE POLICY "Public can read GPX files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gpx-files');
