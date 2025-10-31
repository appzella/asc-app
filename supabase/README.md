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

## 5. Nächste Schritte

Nach dem Schema-Setup:
1. Repository-Abstraktionsschicht erstellen
2. Migration von mockData.ts zu Supabase Client
3. Supabase Auth implementieren

