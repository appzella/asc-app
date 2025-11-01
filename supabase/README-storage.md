# Supabase Storage Setup für Profilbilder

## Schritt 1: Bucket erstellen (im Dashboard)

1. Gehe zu deinem Supabase Dashboard
2. Navigiere zu **Storage** (links im Menü)
3. Klicke auf **"New bucket"** oder **"Create bucket"**
4. Einstellungen:
   - **Name:** `avatars`
   - **Public bucket:** ✅ Ja (aktiviert)
   - **File size limit:** 5MB (5242880 bytes)
   - **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp` (optional)

## Schritt 2: RLS Policies erstellen (SQL Script)

Nachdem der Bucket erstellt wurde:

1. Öffne den **SQL Editor** in deinem Supabase Dashboard
2. Kopiere den kompletten Inhalt von `supabase/storage-setup.sql`
3. Führe das Script aus

Das Script erstellt die notwendigen RLS-Policies, damit:
- Authentifizierte User Profilbilder hochladen können
- Alle authentifizierten User Profilbilder lesen können
- User ihre eigenen Profilbilder löschen können

## Troubleshooting

### Fehler: "must be owner of table objects"
- **Lösung:** Dies ist normal. Das Script versucht nicht mehr, RLS direkt zu aktivieren.
- RLS auf `storage.objects` wird automatisch von Supabase verwaltet.

### Fehler: "new row violates row-level security policy"
- **Lösung:** Stelle sicher, dass:
  1. Der Bucket `avatars` existiert und öffentlich ist
  2. Das `storage-setup.sql` Script vollständig ausgeführt wurde
  3. Der User authentifiziert ist (`auth.role() = 'authenticated'`)

### Bucket nicht sichtbar
- Überprüfe im Dashboard unter **Storage** → **Buckets**, ob `avatars` existiert
- Falls nicht, erstelle ihn manuell wie in Schritt 1 beschrieben

