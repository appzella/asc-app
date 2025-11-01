# Supabase Edge Functions

Dieses Verzeichnis enthält Supabase Edge Functions für serverseitige Operationen.

## Setup

### 1. Supabase CLI installieren

```bash
npm install -g supabase
```

### 2. Login und Project verlinken

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Deine Project Reference findest du in deinem Supabase Dashboard unter Project Settings → General → Reference ID.

### 3. Environment Secrets setzen

```bash
supabase secrets set RESEND_API_KEY=your-resend-api-key-here
```

**Resend API Key erhalten:**
1. Gehe zu [resend.com](https://resend.com)
2. Erstelle einen Account (kostenlos)
3. Navigiere zu API Keys
4. Erstelle einen neuen API Key
5. Kopiere den Key und setze ihn als Secret

### 4. Domain verifizieren (Optional, aber empfohlen)

**Für Produktion:**
1. In Resend Dashboard: Domains → Add Domain
2. Domain hinzufügen (z.B. `asc-skiclub.ch`)
3. DNS Records einrichten (werden von Resend bereitgestellt)
4. Warte auf Verifizierung
5. In der Edge Function `from` Adresse anpassen:
   ```typescript
   from: 'ASC Skiclub <noreply@asc-skiclub.ch>',
   ```

**Für Entwicklung:**
Resend erlaubt E-Mails an verifizierte E-Mail-Adressen ohne Domain-Verifizierung.

### 5. Edge Function deployen

```bash
supabase functions deploy send-invitation-email
```

### 6. Function testen (optional)

```bash
supabase functions invoke send-invitation-email \
  --body '{"email":"test@example.com","token":"test-token","inviterName":"Test Admin","appUrl":"http://localhost:3000"}'
```

## Funktionen

### `send-invitation-email`

Sendet eine Einladungs-E-Mail für neue Benutzer.

**Input:**
```json
{
  "email": "newuser@example.com",
  "token": "inv_1234567890_abc123",
  "inviterName": "Max Mustermann",
  "appUrl": "https://your-app.vercel.app"
}
```

**Output:**
```json
{
  "success": true,
  "data": { "id": "..." }
}
```

**Fehler:**
```json
{
  "error": "Error message"
}
```

## Kosten

- **Supabase Edge Functions**: Kostenlos bis 500k Invocations/Monat
- **Resend**: 
  - Kostenlos: 3.000 E-Mails/Monat
  - Pro: $20/Monat für 50.000 E-Mails
  - Enterprise: Auf Anfrage

## Troubleshooting

### "RESEND_API_KEY not set"
- Stelle sicher, dass das Secret gesetzt ist: `supabase secrets list`
- Falls nicht: `supabase secrets set RESEND_API_KEY=your-key`

### "Email service not configured"
- Überprüfe, ob der RESEND_API_KEY korrekt ist
- Teste den Key in Resend Dashboard

### "Failed to send email"
- Überprüfe die E-Mail-Adresse (muss bei Resend verifiziert sein, wenn keine Domain verifiziert wurde)
- Schau in Resend Dashboard → Logs für Details

### CORS Fehler
- Edge Functions haben CORS bereits konfiguriert
- Falls Probleme: Überprüfe, ob die Function korrekt deployed ist

## Lokale Entwicklung

```bash
# Edge Functions lokal starten
supabase functions serve send-invitation-email

# In separatem Terminal testen
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-invitation-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","token":"test","inviterName":"Test","appUrl":"http://localhost:3000"}'
```

## Weitere Funktionen

Weitere Edge Functions können hinzugefügt werden für:
- Tour-Benachrichtigungen
- Chat-Benachrichtigungen
- Passwort-Reset Bestätigungen
- etc.

