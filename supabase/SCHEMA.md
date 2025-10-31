# Supabase Schema Documentation

## Tabellen-Übersicht

### `users`
Erweitert Supabase Auth Users mit App-spezifischen Daten.

**Felder:**
- `id`: UUID (referenziert `auth.users`)
- `email`: TEXT (unique)
- `name`: TEXT
- `role`: ENUM ('admin', 'leader', 'member')
- `invited_by`: UUID (optional, FK zu users)
- `registration_token`: TEXT (optional)
- `registered`: BOOLEAN
- `profile_photo`: TEXT (Base64 oder URL)
- `phone`, `mobile`, `street`, `zip`, `city`: TEXT (optional)

### `tours`
Haupttabelle für Touren.

**Felder:**
- `id`: UUID (PK)
- `title`, `description`: TEXT
- `date`: TIMESTAMPTZ
- `difficulty`: ENUM (T1-T6, L/WS/ZS/S/SS/AS/EX, B1-B5)
- `tour_type`: ENUM ('Wanderung', 'Skitour', 'Bike')
- `tour_length`: ENUM ('Eintagestour', 'Mehrtagestour')
- `elevation`: INTEGER (Höhenmeter)
- `duration`: INTEGER (Stunden)
- `leader_id`: UUID (FK zu users)
- `max_participants`: INTEGER
- `status`: ENUM ('pending', 'approved', 'rejected')
- `rejection_comment`: TEXT (optional)
- `pending_changes`: JSONB (optional, für ausstehende Änderungen)
- `created_by`: UUID (FK zu users)

### `tour_participants`
Junction-Tabelle für Tour-Anmeldungen (Many-to-Many).

**Felder:**
- `id`: UUID (PK)
- `tour_id`: UUID (FK zu tours)
- `user_id`: UUID (FK zu users)
- `created_at`: TIMESTAMPTZ

### `chat_messages`
Chat-Nachrichten für Touren.

**Felder:**
- `id`: UUID (PK)
- `tour_id`: UUID (FK zu tours)
- `user_id`: UUID (FK zu users)
- `message`: TEXT
- `created_at`: TIMESTAMPTZ

### `invitations`
Einladungen für neue Benutzer.

**Felder:**
- `id`: UUID (PK)
- `email`: TEXT
- `token`: TEXT (unique)
- `created_by`: UUID (FK zu users)
- `used`: BOOLEAN
- `used_at`: TIMESTAMPTZ (optional)

### `tour_settings`
Einstellungen für Tourentypen, Längen und Schwierigkeitsgrade.

**Felder:**
- `id`: UUID (PK)
- `setting_type`: ENUM ('tour_type', 'tour_length', 'difficulty')
- `setting_key`: TEXT (z.B. 'Wanderung', 'Eintagestour', 'T1')
- `setting_value`: TEXT (für difficulties: zugehöriger tour_type)
- `display_order`: INTEGER (für Sortierung)

## Views

### `tours_with_participants`
Vereinfacht Zugriff auf Touren mit Teilnehmer-Anzahl und IDs.

### `chat_messages_with_user`
Chat-Nachrichten mit User-Informationen (Name, Email, Profilbild).

## Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert mit folgenden Policies:

1. **Users**: Eigene Profile + Admin-Zugriff
2. **Tours**: 
   - Alle können approved Tours sehen
   - Leaders können eigene Touren erstellen/bearbeiten
   - Admins können alle Touren verwalten
3. **Tour Participants**: 
   - Jeder kann Teilnehmer sehen
   - Jeder kann sich selbst anmelden/abmelden
   - Admins können alle verwalten
4. **Chat Messages**: 
   - Nur Teilnehmer können lesen/schreiben
   - Tourenleiter können lesen/schreiben
   - Admins können alles verwalten
5. **Invitations**: Nur Admins
6. **Tour Settings**: Alle können lesen, nur Admins können ändern

## Migration von lib/types.ts

| TypeScript Interface | Supabase Table | Notes |
|---------------------|----------------|-------|
| `User` | `users` | Erweitert `auth.users` |
| `Tour` | `tours` + `tour_participants` | participants als Junction-Tabelle |
| `ChatMessage` | `chat_messages` | - |
| `Invitation` | `invitations` | - |
| `TourSettings` | `tour_settings` | Normalisiert in einzelne Zeilen |

