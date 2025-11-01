# E-Mail Service Setup - Schritt für Schritt

## Bereits erledigt ✅
- ✅ Resend Account erstellt
- ✅ API Key vorhanden
- ✅ Edge Function Code erstellt

## Nächste Schritte

### 1. Supabase CLI Login (im Terminal)

Öffne ein Terminal und führe aus:

```bash
cd /Users/pascalstaub/asc-app
npx supabase login
```

Das öffnet einen Browser für die Authentifizierung. Folge den Anweisungen.

### 2. Projekt verlinken

```bash
npx supabase link --project-ref zcfonwdydljvknsrrala
```

### 3. Resend API Key als Secret setzen

**WICHTIG:** Ersetze `YOUR_RESEND_API_KEY` mit deinem tatsächlichen API Key aus Resend.

```bash
npx supabase secrets set RESEND_API_KEY=YOUR_RESEND_API_KEY
```

Um zu prüfen, ob das Secret gesetzt wurde:
```bash
npx supabase secrets list
```

### 4. Edge Function deployen

```bash
npx supabase functions deploy send-invitation-email
```

### 5. (Optional) App URL setzen

Falls deine App auf Vercel läuft, wird die URL automatisch erkannt. 
Falls nicht, setze in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### 6. Testen

1. Als Admin einloggen
2. Zu "Einladungen" navigieren
3. Neue Einladung mit einer **verifizierten E-Mail-Adresse** erstellen

**Hinweis:** Ohne Domain-Verifizierung in Resend musst du die E-Mail-Adresse zuerst in Resend verifizieren:
- Resend Dashboard → Emails → Add Email
- E-Mail-Adresse eingeben
- Bestätigungslink in der E-Mail klicken

## Troubleshooting

### "RESEND_API_KEY not set"
```bash
# Prüfe ob Secret gesetzt ist
npx supabase secrets list

# Falls nicht, setze es erneut
npx supabase secrets set RESEND_API_KEY=your-key
```

### "Failed to send email"
- Prüfe ob die E-Mail-Adresse in Resend verifiziert ist (ohne Domain-Verifizierung)
- Prüfe Resend Dashboard → Logs für Details
- Prüfe Spam-Ordner

### Function nicht gefunden
```bash
# Liste alle Functions
npx supabase functions list

# Falls nicht vorhanden, deploye erneut
npx supabase functions deploy send-invitation-email
```

## Erfolgreich? 🎉

Wenn alles funktioniert, solltest du beim Erstellen einer Einladung die Meldung sehen:
**"Einladung erstellt und E-Mail an [email] gesendet!"**

Die E-Mail enthält:
- Professionelles HTML-Design
- Direkter Registrierungslink
- Gültigkeitsdauer: 7 Tage

