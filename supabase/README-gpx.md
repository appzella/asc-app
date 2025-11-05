# GPX-Datei Support für Touren

Diese Dokumentation beschreibt, wie man die GPX-Upload-Funktionalität für Touren einrichtet.

## Übersicht

Die App unterstützt jetzt das Hochladen von GPX-Dateien für Touren, um den Tour-Verlauf auf einer Karte zu visualisieren. Die Karten verwenden die swisstopo GeoAdmin API.

## Einrichtung

### Schritt 1: Datenbank-Migration ausführen

Führe die Migration aus, um das `gpx_file` Feld zur `tours` Tabelle hinzuzufügen:

1. Öffne den **SQL Editor** in deinem Supabase Dashboard
2. Kopiere den Inhalt von `supabase/migration-add-gpx-file.sql`
3. Führe das Script aus

```sql
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS gpx_file TEXT;
```

### Schritt 2: Supabase Storage Bucket erstellen

1. Gehe zu deinem Supabase Dashboard
2. Navigiere zu **Storage** (links im Menü)
3. Klicke auf **"New bucket"** oder **"Create bucket"**
4. Einstellungen:
   - **Name:** `gpx-files`
   - **Public bucket:** ✅ Ja (aktiviert)
   - **File size limit:** 10MB (10485760 bytes)
   - **Allowed MIME types:** `application/gpx+xml, application/xml, text/xml` (optional)

### Schritt 3: RLS Policies erstellen

Nachdem der Bucket erstellt wurde:

1. Öffne den **SQL Editor** in deinem Supabase Dashboard
2. Kopiere den kompletten Inhalt von `supabase/storage-setup-gpx.sql`
3. Führe das Script aus

Das Script erstellt die notwendigen RLS-Policies, damit:
- Leaders und Admins GPX-Dateien hochladen können
- Alle authentifizierten User GPX-Dateien lesen können
- Leaders ihre eigenen GPX-Dateien löschen können
- Admins alle GPX-Dateien löschen können

## Nutzung

### GPX-Datei hochladen

1. Beim Erstellen einer neuen Tour:
   - Im Formular gibt es ein optionales Feld "GPX-Datei"
   - Wähle eine GPX-Datei aus (max. 10MB)
   - Die Datei wird automatisch hochgeladen und mit der Tour verknüpft

2. In der Tour-Detailansicht:
   - Wenn eine GPX-Datei vorhanden ist, wird automatisch eine Karte angezeigt
   - Die Karte zeigt den Tour-Verlauf mit Start- und Endpunkt
   - Es gibt drei Layer-Optionen:
     - **Karte**: Standard pixelkarte-farbe
     - **Satellit**: swissimage (Satellitenbilder)
     - **Topo**: landeskarte (Topografische Karte)

## Technische Details

### Swisstopo Karten

Die App verwendet die swisstopo GeoAdmin API über WMTS (Web Map Tile Service):
- **Kein API-Key erforderlich** für Standard-Layer
- Kostenlos, aber unterliegt den [Nutzungsbedingungen](https://www.geo.admin.ch/terms-of-use)
- Verfügbare Layer:
  - `ch.swisstopo.pixelkarte-farbe` - Standard Karte
  - `ch.swisstopo.swissimage` - Satellitenbilder
  - `ch.swisstopo.landeskarte` - Topografische Karte

### Technologie-Stack

- **Leaflet**: JavaScript-Bibliothek für interaktive Karten
- **react-leaflet**: React-Komponenten für Leaflet
- **leaflet-gpx**: Plugin zum Parsen und Anzeigen von GPX-Dateien

### Dateistruktur

GPX-Dateien werden in Supabase Storage gespeichert unter:
```
gpx-files/
  └── gpx/
      └── {tourId}/
          └── {timestamp}.gpx
```

## Troubleshooting

### Fehler: "Bucket gpx-files not found"
- **Lösung:** Stelle sicher, dass der Bucket `gpx-files` im Supabase Dashboard erstellt wurde und öffentlich ist

### Fehler: "must be owner of table objects"
- **Lösung:** Dies ist normal. RLS auf `storage.objects` wird automatisch von Supabase verwaltet.

### Fehler: "new row violates row-level security policy"
- **Lösung:** Stelle sicher, dass:
  1. Der Bucket `gpx-files` existiert und öffentlich ist
  2. Das `storage-setup-gpx.sql` Script vollständig ausgeführt wurde
  3. Der User authentifiziert ist und die Rolle "leader" oder "admin" hat

### Karte wird nicht angezeigt
- **Lösung:** 
  1. Prüfe, ob die GPX-Datei korrekt hochgeladen wurde (im Browser Developer Tools Network Tab)
  2. Prüfe, ob die GPX-Datei gültig ist
  3. Prüfe die Browser-Konsole auf Fehler

### WMTS-Tiles werden nicht geladen
- **Lösung:** 
  1. Prüfe die Browser-Konsole auf CORS-Fehler
  2. Stelle sicher, dass die swisstopo-Server erreichbar sind
  3. Prüfe die WMTS-URL im Network Tab

## Weitere Informationen

- [Swisstopo GeoAdmin API Dokumentation](https://api.geo.admin.ch/)
- [Swisstopo Nutzungsbedingungen](https://www.geo.admin.ch/terms-of-use)
- [Leaflet Dokumentation](https://leafletjs.com/)
- [react-leaflet Dokumentation](https://react-leaflet.js.org/)

