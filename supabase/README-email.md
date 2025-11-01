# E-Mail Service Setup

Der E-Mail Service verwendet Supabase Edge Functions zusammen mit Resend für den Versand von Einladungs-E-Mails.

## Übersicht

1. **Supabase Edge Function**: Serverless Funktion für E-Mail-Versand
2. **Resend**: E-Mail-Service Provider
3. **Next.js API Route**: Wrapper für den Aufruf der Edge Function
4. **UI Integration**: Automatischer E-Mail-Versand bei Erstellung einer Einladung

## Setup Anleitung

### Schritt 1: Resend Account erstellen

1. Gehe zu [resend.com](https://resend.com)
2. Erstelle einen kostenlosen Account
3. Navigiere zu **API Keys**
4. Erstelle einen neuen API Key
5. **Wichtig**: Kopiere den API Key (wird nur einmal angezeigt)

### Schritt 2: Supabase CLI installieren

```bash
npm install -g supabase
```

### Schritt 3: Supabase Project verlinken

```bash
# Login zu Supabase
supabase login

# Project verlinken (finde deine Project Reference im Dashboard)
supabase link --project-ref YOUR_PROJECT_REF
```

### Schritt 4: Resend API Key als Secret setzen

```bash
supabase secrets set RESEND_API_KEY=your-resend-api-key-here
```

### Schritt 5: Edge Function deployen

```bash
supabase functions deploy send-invitation-email
```

### Schritt 6: Environment Variable für App URL setzen (optional)

Falls deine App nicht auf Vercel läuft oder eine andere URL hat:

**In `.env.local`:**
```env
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

**Oder in Vercel:**
- Settings → Environment Variables
- `NEXT_PUBLIC_APP_URL` = deine Production URL

### Schritt 7: Domain verifizieren (für Produktion empfohlen)

**Ohne Domain-Verifizierung:**
- Resend erlaubt nur E-Mails an **verifizierte E-Mail-Adressen**
- Für jeden Test-Empfänger: Resend Dashboard → Emails → Add Email

**Mit Domain-Verifizierung (empfohlen für Produktion):**
1. In Resend Dashboard: **Domains** → **Add Domain**
2. Domain eingeben (z.B. `asc-skiclub.ch`)
3. DNS Records einrichten (werden von Resend bereitgestellt)
4. Warte auf Verifizierung (meist 5-10 Minuten)
5. In `supabase/functions/send-invitation-email/index.ts` die `from` Adresse anpassen:
   ```typescript
   from: 'ASC Skiclub <noreply@asc-skiclub.ch>',
   ```
6. Function neu deployen: `supabase functions deploy send-invitation-email`

## Testing

### 1. Edge Function direkt testen

```bash
supabase functions invoke send-invitation-email \
  --body '{
    "email":"test@example.com",
    "token":"test-token-123",
    "inviterName":"Test Admin",
    "appUrl":"http://localhost:3000"
  }'
```

### 2. Über die App testen

1. Als Admin einloggen
2. Zu **Einladungen** navigieren
3. Neue Einladung mit einer **verifizierten E-Mail-Adresse** erstellen
4. E-Mail sollte automatisch gesendet werden

**Hinweis**: Ohne Domain-Verifizierung muss die E-Mail-Adresse in Resend verifiziert sein.

## Funktionsweise

### Workflow

1. **Admin erstellt Einladung** → `invitations/page.tsx`
2. **Einladung wird in DB gespeichert** → `dataRepository.createInvitation()`
3. **API Route wird aufgerufen** → `/api/invitations/send-email`
4. **Edge Function wird invokiert** → `send-invitation-email`
5. **Resend sendet E-Mail** → Empfänger erhält E-Mail mit Registrierungslink
6. **Benutzer klickt Link** → Registriert sich über `/register/[token]`

### Fehlerbehandlung

- **E-Mail-Versand erfolgreich**: Erfolgsmeldung wird angezeigt
- **E-Mail-Versand fehlgeschlagen**: Fallback: Registrierungslink wird angezeigt (kann manuell kopiert werden)

## Kosten

- **Supabase Edge Functions**: 
  - Kostenlos bis 500.000 Invocations/Monat
  - Danach: $0.0000002 per Invocation

- **Resend**:
  - **Free Tier**: 3.000 E-Mails/Monat
  - **Pro**: $20/Monat für 50.000 E-Mails
  - **Enterprise**: Auf Anfrage

Für die meisten Clubs sollte das Free Tier ausreichen.

## Troubleshooting

### "RESEND_API_KEY not set"
```bash
# Prüfe ob Secret gesetzt ist
supabase secrets list

# Falls nicht, setze es
supabase secrets set RESEND_API_KEY=your-key
```

### "Email service not configured"
- Überprüfe, ob `RESEND_API_KEY` korrekt gesetzt ist
- Teste den Key im Resend Dashboard

### "Failed to send email"
- E-Mail-Adresse muss bei Resend verifiziert sein (wenn keine Domain verifiziert wurde)
- Prüfe Resend Dashboard → **Logs** für Details
- Überprüfe Spam-Ordner

### E-Mail kommt nicht an
- Prüfe Spam-Ordner
- E-Mail-Adresse muss verifiziert sein (ohne Domain-Verifizierung)
- Prüfe Resend Dashboard → **Logs**

### Edge Function nicht gefunden
- Stelle sicher, dass die Function deployed ist: `supabase functions list`
- Falls nicht: `supabase functions deploy send-invitation-email`

## Erweiterte Features (zukünftig)

Die Struktur erlaubt einfach weitere E-Mail-Funktionen:

1. **Tour-Benachrichtigungen**
   - Neue Tour veröffentlicht
   - Tour abgesagt
   - Erinnerung vor Tour

2. **Chat-Benachrichtigungen**
   - Neue Nachricht in Tour

3. **Anmelde-Benachrichtigungen**
   - Teilnehmer hat sich angemeldet
   - Tour ist voll

## Support

Bei Problemen:
1. Prüfe Supabase Dashboard → Logs → Edge Functions
2. Prüfe Resend Dashboard → Logs
3. Prüfe Browser Console für Fehler
4. Prüfe Vercel/Deployment Logs

