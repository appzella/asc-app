# Supabase Email Confirmation Anpassen

Supabase Auth sendet standardmäßig eine Bestätigungs-E-Mail, wenn sich ein Benutzer registriert. Da wir bereits eine eigene Einladungs-E-Mail senden, können wir dies anpassen.

## Option 1: Email Confirmation für eingeladene Benutzer deaktivieren (Empfohlen)

Da wir bereits ein Einladungssystem haben, das die E-Mail validiert, können wir Email Confirmation für eingeladene Benutzer deaktivieren.

### Im Supabase Dashboard:

1. Gehe zu **Authentication** → **Settings**
2. Unter **Email Auth**:
   - **Enable Email Confirmations**: ✅ Aktiviert lassen (für Sicherheit)
   - **Enable Custom SMTP**: Optional (falls du eigene E-Mails senden willst)

### Alternative: Custom Email Templates

1. Gehe zu **Authentication** → **Email Templates**
2. Passe das **Confirm signup** Template an:
   - Entferne oder ändere den Standard-Text
   - Füge einen Hinweis hinzu, dass dies nur für direkte Registrierungen ohne Einladung gilt

## Option 2: Email Confirmation komplett deaktivieren (Nicht empfohlen)

⚠️ **Warnung**: Dies reduziert die Sicherheit, da E-Mails nicht validiert werden.

1. Gehe zu **Authentication** → **Settings**
2. Unter **Email Auth**:
   - **Enable Email Confirmations**: ❌ Deaktivieren

## Option 3: User automatisch bestätigen nach Registrierung über Einladung

Wir können einen Database Trigger erstellen, der Benutzer automatisch bestätigt, wenn sie über eine Einladung registriert werden.

### SQL Script:

```sql
-- Function to auto-confirm users registered via invitation
CREATE OR REPLACE FUNCTION public.auto_confirm_invited_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user was created via invitation (has registration_token)
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.id 
    AND registration_token IS NOT NULL
  ) THEN
    -- Auto-confirm the email
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-confirm after user profile is created
DROP TRIGGER IF EXISTS on_user_created_auto_confirm ON public.users;

CREATE TRIGGER on_user_created_auto_confirm
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_invited_user();
```

**Vorsicht**: Dies erfordert `SECURITY DEFINER` und direkten Zugriff auf `auth.users`. Prüfe die Berechtigungen.

## Empfehlung

Für die beste User Experience:

1. **Email Confirmation aktiviert lassen** (für Sicherheit)
2. **Custom Email Template anpassen** im Supabase Dashboard
   - Klarer Hinweis: "Sie wurden eingeladen. Bitte verwenden Sie den Link aus der Einladungs-E-Mail."
3. **Oder**: Email Confirmation für eingeladene Benutzer im Code überspringen (siehe Option 3)

## Aktuelle Implementierung

Die aktuelle Implementierung:
- Sendet `emailRedirectTo` zur Registrierungsseite mit Token
- Der Benutzer muss beide E-Mails befolgen (Einladung + Bestätigung)

**Besser**: Email Confirmation Template anpassen, um den Benutzer auf die Einladungs-E-Mail zu verweisen.

