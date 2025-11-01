# Supabase Setup Guide

## 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Notiere dir die folgenden Credentials:
   - Project URL
   - Anon/Public Key
   - Service Role Key (für Admin-Operationen)

## 2. Schema migrieren

1. Öffne die SQL Editor in deinem Supabase Dashboard
2. Kopiere den Inhalt von `supabase/schema.sql`
3. Führe das SQL-Script aus
4. **Wichtig:** Kopiere auch den Inhalt von `supabase/auth-trigger.sql` und führe ihn aus
   - Dieser Trigger erstellt automatisch einen User-Eintrag in `public.users`, wenn ein Auth-User erstellt wird

## 3. Environment Variables

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Wichtig:** Füge `.env.local` zur `.gitignore` hinzu!

## 4. Row Level Security (RLS)

Das Schema enthält bereits RLS Policies für:
- ✅ Users: Eigene Profile + Admin-Zugriff
- ✅ Tours: Alle können approved Tours sehen, Leaders können eigene erstellen
- ✅ Tour Participants: Jeder kann teilnehmen/abmelden
- ✅ Chat Messages: Nur Teilnehmer können lesen/schreiben
- ✅ Invitations: Nur Admins können verwalten
- ✅ Tour Settings: Alle können lesen, nur Admins können ändern

## 5. Auth Setup

Die App verwendet Supabase Auth für die Authentifizierung. Der Auth Service (`lib/auth.ts`) wählt automatisch zwischen Supabase Auth und Mock Auth basierend auf den Environment Variables.

### Funktionsweise:

1. **Login**: Benutzer melden sich mit E-Mail und Passwort an
2. **Auth Trigger**: Wenn ein neuer Auth-User erstellt wird, erstellt der Trigger automatisch einen Eintrag in `public.users`
3. **User Profile**: Die App lädt das User-Profile aus `public.users` nach erfolgreicher Authentifizierung
4. **Session Management**: Supabase Auth verwaltet Sessions automatisch (refresh, expiry, etc.)

### Migration von Mock zu Supabase:

Wenn `NEXT_PUBLIC_SUPABASE_URL` gesetzt ist, verwendet die App automatisch Supabase Auth. Ansonsten fällt sie auf Mock Auth zurück (für Entwicklung ohne Supabase).

## 6. Realtime Setup

Für Echtzeit-Chat-Updates muss Realtime für die `chat_messages` Tabelle aktiviert sein:

1. Öffne den **SQL Editor** in deinem Supabase Dashboard
2. Kopiere den Inhalt von `supabase/realtime-setup.sql` und führe ihn aus
3. Das Script erstellt die `supabase_realtime` Publikation (falls nicht vorhanden) und fügt `chat_messages` hinzu
4. Am Ende zeigt das Script eine Bestätigung, ob Realtime aktiviert ist

**Überprüfung:** 
- Das Script zeigt am Ende selbst eine Bestätigung
- Alternativ kannst du im SQL Editor prüfen:
  ```sql
  SELECT tablename FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime' 
  AND tablename = 'chat_messages';
  ```
  Wenn eine Zeile zurückkommt, ist Realtime aktiviert.

## 7. E-Mail Service Setup

Für automatischen E-Mail-Versand von Einladungslinks:
1. Siehe `supabase/README-email.md` für detaillierte Anleitung
2. Kurzfassung:
   - Resend Account erstellen (kostenlos)
   - Supabase CLI installieren und Projekt verlinken
   - `RESEND_API_KEY` als Secret setzen
   - Edge Function deployen: `supabase functions deploy send-invitation-email`

## 8. Nächste Schritte

Nach dem Schema-Setup:
1. ✅ Repository-Abstraktionsschicht erstellt
2. ✅ Migration von mockData.ts zu Supabase Client
3. ✅ Supabase Auth implementiert
4. ✅ Supabase Realtime für Chat-Updates implementiert
5. ✅ E-Mail-Service für Einladungslinks eingerichtet
6. ⏭️ Web Push API Setup und Notification-Events implementieren

