# ASC Skitouren PWA - Implementierungsplan

## Technologie-Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **PWA:** next-pwa für Service Worker und Manifest
- **State Management:** React Context API / Zustand (für Dummy-Daten)
- **Authentication:** Custom Auth System mit Dummy-Daten (später Supabase)
- **Notifications:** Web Push API (für Push-Notifications)

## Projektstruktur

```
asc-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/[token]/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   ├── tours/
│   │   │   ├── [id]/
│   │   │   ├── archive/
│   │   │   └── create/
│   │   ├── users/ (admin only)
│   │   ├── invitations/ (admin only)
│   │   ├── settings/ (admin only)
│   │   ├── help/
│   │   └── profile/
│   ├── api/ (für später Supabase-Integration)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── tours/
│   │   └── TourCard.tsx
│   ├── chat/
│   │   └── ChatWindow.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       └── Textarea.tsx
├── lib/
│   ├── data/
│   │   └── mockData.ts (Dummy-Daten)
│   ├── auth.ts
│   ├── roles.ts
│   ├── difficulty.ts
│   └── types.ts
├── public/
│   ├── manifest.json
│   └── icons/
└── tailwind.config.js
```

## Hauptfunktionalitäten

### 1. Authentifizierung & Rollen

- **Login-System:** E-Mail/Passwort für Clubmitglieder
- **Einladungssystem:** Admin erstellt User-Account mit E-Mail → User erhält Registrierungslink mit Token
- **Rollen:** Admin, Leader, Member mit entsprechenden Berechtigungen
- **Protected Routes:** Middleware für rollenbasierte Zugriffskontrolle

### 2. Tourenverwaltung

- **Tour-Erstellung:** Leader können Touren erstellen (Status: "pending")
- **Freigabe-Workflow:** Admin gibt Touren frei → Status: "approved" → sichtbar für alle Mitglieder
- **Tour-Details:** Schwierigkeit, Tourenart, Tourlänge, Höhenmeter, Dauer, Tourenleiter, Datum, max. Teilnehmerzahl
- **Anmeldung:** Mitglieder können sich an/abmelden (bis max. Teilnehmerzahl erreicht)
- **Tour-Liste:** Filterbar nach Status, Datum, Tourenart, Tourlänge, Schwierigkeit
- **Sortierung:** Touren werden nach Datum sortiert (nächste Tour zuerst)
- **Tourenarchiv:** Automatische Archivierung vergangener Touren, separate Archiv-Seite

### 3. Chat-Funktionalität

- **Tour-Chat:** Jede Tour hat einen eigenen Chat
- **Features:** Nachrichten senden, Echtzeit-Updates (mit Dummy-Daten simuliert)
- **Nutzung:** Fahrgemeinschaften, Absprachen, etc.

### 4. Benutzerverwaltung (Admin)

- **User-Management:** Liste aller Benutzer, Rollen zuweisen
- **Einladungen:** Neue Benutzer erstellen und Einladungslinks generieren

### 5. Einstellungen (Admin)

- **Tourentypen:** Verwaltung der verfügbaren Tourentypen (z.B. Wanderung, Skitour, Bike)
- **Tourlängen:** Verwaltung der Tourlängen (z.B. Eintagestour, Mehrtagestour)
- **Schwierigkeitsgrade:** Verwaltung der Schwierigkeitsgrade pro Tourenart mit Drag & Drop Sortierung

### 6. Profil

- **Profilfoto:** Upload und Verwaltung des Profilfotos (Base64)
- **Persönliche Informationen:** Name, E-Mail, Telefon, Mobile, Adresse bearbeiten

### 7. Tour-Bearbeitung & Versionierung

- **Bearbeitung:** Leader können ihre Touren bearbeiten
- **Versionierung:** System zur Verwaltung von Tour-Versionen (aktuelle vs. ausstehende Änderungen)
- **Änderungsvorschläge:** Änderungen an bereits freigegebenen Touren müssen vom Admin genehmigt werden
- **Ablehnungskommentar:** Admin kann bei Ablehnung einer Tour einen Kommentar hinzufügen

### 8. Dashboard

- **Übersicht:** Statistiken für alle Rollen
- **Meine Touren:** Anzahl der angemeldeten oder geleiteten Touren
- **Verfügbare Touren:** Anzahl der freigegebenen Touren
- **Tourenarchiv:** Anzahl der vergangenen Touren
- **Tour erstellen:** Schnellzugriff für Leader/Admin
- **Pending Tours:** Warnung für Admins/Leaders bei ausstehenden Freigaben

### 9. Hilfe-Seite

- **Umfassende Dokumentation:** Erklärung aller Funktionen der App
- **Rollenbasierte Inhalte:** Verschiedene Abschnitte je nach Benutzerrolle
- **Schritt-für-Schritt-Anleitungen:** Detaillierte Erklärungen für alle Features

### 10. PWA-Features

- **Service Worker:** Offline-Funktionalität für bereits geladene Seiten
- **Web App Manifest:** Installierbar auf mobilen Geräten
- **Push-Notifications:** Benachrichtigungen für neue Touren, Anmeldungen, Chat-Nachrichten (geplant)

## Implementierungsschritte

### ✅ Abgeschlossen

1. ✅ Projekt-Setup: Next.js Projekt mit Tailwind CSS initialisiert
2. ✅ PWA-Konfiguration: Service Worker, Manifest, Icons eingerichtet
3. ✅ TypeScript-Typen: Datenstrukturen für User, Tour, Chat-Message definiert
4. ✅ Dummy-Daten-Layer: In-Memory Datenspeicher mit Seed-Daten
5. ✅ Auth-System: Login, Registrierung, Token-Management implementiert
6. ✅ UI-Komponenten: Reusable Components mit Tailwind CSS (Buttons, Cards, Forms, etc.)
7. ✅ Dashboard: Übersichtsseite für alle Rollen
8. ✅ Tour-Liste: Auflistung mit Filterfunktionen
9. ✅ Tour-Detail: Vollständige Tour-Ansicht mit Anmeldung und Chat
10. ✅ Tour-Erstellung: Formular für Leader zum Erstellen von Touren
11. ✅ Tour-Bearbeitung: Leader können ihre Touren bearbeiten
12. ✅ Versionierung: System zur Verwaltung von Tour-Versionen (aktuelle vs. ausstehende Änderungen)
13. ✅ Admin-Panel: Benutzerverwaltung und Tour-Freigabe (inkl. Änderungsvorschläge)
14. ✅ Ablehnungskommentar: Admin kann Kommentar bei Ablehnung hinzufügen
15. ✅ Profil-Verwaltung: Profilfoto-Upload und persönliche Informationen
16. ✅ Einstellungen: Verwaltung von Tourentypen, Tourlängen und Schwierigkeitsgraden
17. ✅ Tourenarchiv: Automatische Archivierung und separate Archiv-Seite
18. ✅ Sortierung: Touren nach Datum sortiert (nächste zuerst)
19. ✅ Hilfe-Seite: Umfassende Dokumentation aller Funktionen

### 🔄 In Arbeit / Geplant

- 🔄 Push-Notifications: Web Push API Integration
- 🔄 Offline-Support: Service Worker Strategien für Offline-Verfügbarkeit
- 🔄 Supabase-Integration: Migration von Dummy-Daten zu Supabase Backend

## Wichtige Dateien

### Core Dateien

- `lib/types.ts`: TypeScript-Interfaces für User, Tour, Message, Invitation, Settings
- `lib/data/mockData.ts`: Dummy-Daten und State-Management
- `lib/auth.ts`: Authentifizierungs-Logik
- `lib/roles.ts`: Rollenbasierte Berechtigungen
- `lib/difficulty.ts`: Schwierigkeitsgrade-Verwaltung

### UI-Komponenten

- `app/(protected)/layout.tsx`: Protected Route Wrapper mit Rollenprüfung und Navigation
- `components/tours/TourCard.tsx`: Tour-Karte für Listenansicht
- `components/chat/ChatWindow.tsx`: Chat-Komponente für Touren
- `components/ui/`: Wiederverwendbare UI-Komponenten (Button, Card, Input, Select, Textarea)

### Seiten

- `app/(protected)/dashboard/page.tsx`: Dashboard-Übersicht
- `app/(protected)/tours/page.tsx`: Tour-Liste mit Filtern
- `app/(protected)/tours/archive/page.tsx`: Tourenarchiv
- `app/(protected)/tours/[id]/page.tsx`: Tour-Detailseite
- `app/(protected)/tours/[id]/edit/page.tsx`: Tour-Bearbeitung
- `app/(protected)/tours/create/page.tsx`: Tour-Erstellung
- `app/(protected)/users/page.tsx`: Benutzerverwaltung (Admin)
- `app/(protected)/invitations/page.tsx`: Einladungsverwaltung (Admin)
- `app/(protected)/settings/page.tsx`: Einstellungsübersicht (Admin)
- `app/(protected)/settings/tour-types/page.tsx`: Tourentypen-Verwaltung
- `app/(protected)/settings/tour-lengths/page.tsx`: Tourlängen-Verwaltung
- `app/(protected)/settings/difficulties/page.tsx`: Schwierigkeitsgrade-Verwaltung
- `app/(protected)/profile/page.tsx`: Profil-Verwaltung
- `app/(protected)/help/page.tsx`: Hilfe-Seite

### API (für später)

- `app/api/auth/route.ts`: API-Routen für Auth (später Supabase)
- `app/api/tours/route.ts`: API-Routen für Touren
- `app/api/users/route.ts`: API-Routen für Benutzer

## Datenmodell

### User
- id, email, name, role, password (nur für Dummy-Daten)
- createdAt, registered, invitedBy, registrationToken
- profilePhoto, phone, mobile, street, zip, city

### Tour
- id, title, description, date
- difficulty, tourType, tourLength
- elevation, duration, maxParticipants
- leaderId, leader (Referenz)
- status: 'pending' | 'approved' | 'rejected'
- participants: string[] (User-IDs)
- rejectionComment?: string (bei Ablehnung)
- pendingChanges?: Partial<Tour> (ausstehende Änderungen)
- createdAt, updatedAt, createdBy

### ChatMessage
- id, tourId, userId, user (Referenz)
- message, createdAt

### Invitation
- id, email, token, createdBy
- createdAt, used, usedAt

### TourSettings
- tourTypes: string[]
- tourLengths: string[]
- difficulties: { [tourType: string]: string[] }

## Rollen & Berechtigungen

### Member (Mitglied)
- Touren ansehen und durchsuchen
- Sich für freigegebene Touren anmelden
- Am Chat teilnehmen
- Profil bearbeiten

### Leader (Tourenleiter)
- Alle Funktionen eines Mitglieds
- Neue Touren erstellen
- Eigene Touren bearbeiten

### Admin (Administrator)
- Alle Funktionen eines Tourenleiters
- Touren freigeben oder ablehnen
- Änderungen an Touren genehmigen
- Benutzer verwalten
- Einladungen erstellen
- Einstellungen verwalten (Tourentypen, Tourlängen, Schwierigkeitsgrade)

## UI/UX Features

- Responsive Design für Mobile und Desktop
- Moderne Glassmorphism-Effekte
- Smooth Animations und Transitions
- Drag & Drop für Schwierigkeitsgrade-Sortierung
- Filter und Suche für Touren
- Real-time Chat-Updates (simuliert)
- Form-Validierung
- Fehler- und Erfolgsmeldungen
- Loading States

## Nächste Schritte

1. Push-Notifications implementieren
2. Offline-Support erweitern
3. Supabase-Integration vorbereiten
4. Testing und Bug-Fixes
5. Performance-Optimierungen

