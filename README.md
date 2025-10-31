# ASC Skitouren PWA

Progressive Web App für die Tourenverwaltung des Alpinen Skiclubs St. Gallen (ASC).

## Features

- **Rollenbasierte Zugriffskontrolle**: Admin, Leader, Member
- **Tourenverwaltung**: Erstellung, Bearbeitung und Freigabe von Touren
- **Anmeldungssystem**: Mitglieder können sich für Touren an/abmelden
- **Chat-Funktionalität**: Kommunikation innerhalb jeder Tour
- **Einladungssystem**: Admins können neue Mitglieder per E-Mail einladen
- **PWA-Funktionalität**: Installierbar und offline-fähig

## Technologie-Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **next-pwa** (Service Worker & Manifest)
- **Zustand** (State Management - vorbereitet)

## Installation

1. Dependencies installieren:
```bash
npm install
```

2. Entwicklungsserver starten:
```bash
npm run dev
```

3. App öffnen:
```
http://localhost:3000
```

## Demo-Accounts

- **Admin**: admin@asc.ch / admin123
- **Leader**: leader@asc.ch / leader123
- **Member**: member@asc.ch / member123

## Projektstruktur

```
asc-app/
├── app/                    # Next.js App Router Seiten
│   ├── (auth)/            # Authentifizierungs-Routes
│   │   ├── login/
│   │   └── register/[token]/
│   └── (protected)/       # Geschützte Routes
│       ├── dashboard/
│       ├── tours/
│       ├── users/         # Admin only
│       └── invitations/   # Admin only
├── components/            # React Komponenten
│   ├── auth/
│   ├── tours/
│   ├── chat/
│   └── ui/                # Basis UI-Komponenten
├── lib/                   # Utilities & Business Logic
│   ├── data/             # Dummy-Daten (später Supabase)
│   ├── auth.ts           # Authentifizierung
│   ├── roles.ts          # Rollen & Berechtigungen
│   └── types.ts          # TypeScript-Typen
└── public/                # Statische Dateien
    ├── manifest.json     # PWA Manifest
    └── icons/            # PWA Icons
```

## Funktionen im Detail

### Rollen

- **Admin**: 
  - Verwaltet Benutzer und Rollen
  - Gibt Touren frei/lehnt ab
  - Erstellt Einladungen für neue Mitglieder

- **Leader**: 
  - Erstellt neue Touren
  - Bearbeitet eigene Touren
  - Änderungen an freigegebenen Touren müssen vom Admin genehmigt werden

- **Member**: 
  - Sieht freigegebene Touren
  - Meldet sich für Touren an/ab
  - Nutzt Chat-Funktionalität

### Touren-Workflow

1. **Leader erstellt Tour** → Status: `pending`
2. **Admin gibt Tour frei** → Status: `approved` → Tour ist sichtbar
3. **Leader bearbeitet freigegebene Tour** → Status geht zurück auf `pending`
4. **Admin genehmigt Änderungen** → Tour wird aktualisiert

### Einladungssystem

1. Admin erstellt Einladung mit E-Mail-Adresse
2. System generiert Registrierungslink mit Token
3. Link wird per E-Mail verschickt (manuell im Demo)
4. Neues Mitglied registriert sich über den Link
5. Account wird aktiviert

## PWA Features

- **Service Worker**: Für Offline-Funktionalität
- **Web App Manifest**: Installation auf mobilen Geräten
- **Push-Notifications**: (Vorbereitet, noch nicht implementiert)

## Nächste Schritte

1. **Supabase Integration**: 
   - Ersetze Dummy-Daten durch Supabase
   - Echte Datenbankverbindung
   - Echtzeit-Updates

2. **E-Mail-Versand**: 
   - Einladungslinks automatisch per E-Mail versenden
   - Benachrichtigungen bei Tour-Änderungen

3. **Push-Notifications**: 
   - Web Push API implementieren
   - Benachrichtigungen für neue Touren, Anmeldungen, etc.

4. **PWA Icons**: 
   - App-Icons in verschiedenen Größen erstellen
   - Platzhalter-Icons durch echte Icons ersetzen

## Entwicklung

### Build für Produktion

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Lizenz

Interne Nutzung für ASC St. Gallen

