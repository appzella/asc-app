# Security Advisor - Beheben von Warnungen

Dieses Dokument erklärt, wie die Security Advisor Warnungen im Supabase Dashboard behoben werden.

## ✅ Code-basierte Fixes (automatisch durch Migration)

### 1. Security Definer Views (ERROR)
**Problem:** Views mit `SECURITY DEFINER` verwenden die Berechtigungen des View-Erstellers statt des abfragenden Benutzers.

**Lösung:** Führe `supabase/migration-fix-security-definer-views.sql` im SQL Editor aus.

Die Migration erstellt die Views neu ohne `SECURITY DEFINER`, sodass sie die RLS-Policies der zugrunde liegenden Tabellen respektieren.

### 2. Function Search Path Mutable (WARN)
**Problem:** Funktionen ohne festgelegten `search_path` können ein Sicherheitsrisiko darstellen.

**Lösung:** Die Migration `migration-fix-security-definer-views.sql` aktualisiert alle Funktionen mit `SET search_path = public, pg_catalog`.

**Betroffene Funktionen:**
- `update_updated_at_column`
- `handle_new_user`
- `auto_confirm_invited_user`

Alle Funktionen sind bereits in `schema.sql`, `auth-trigger.sql` und `auto-confirm-invited-users.sql` aktualisiert.

## ⚙️ Dashboard-basierte Fixes (manuell im Supabase Dashboard)

### 3. Leaked Password Protection (WARN)
**Problem:** Schutz gegen kompromittierte Passwörter ist deaktiviert.

**Lösung:**
1. Gehe zu **Authentication** → **Settings** → **Password**
2. Aktiviere **"Leaked password protection"**
3. Diese Funktion prüft Passwörter gegen die HaveIBeenPwned.org Datenbank

**Hinweis:** Dies ist eine gute Sicherheitspraxis und verhindert die Verwendung von bekannten kompromittierten Passwörtern.

### 4. Insufficient MFA Options (WARN)
**Problem:** Zu wenige Multi-Factor Authentication (MFA) Optionen aktiviert.

**Lösung:**
1. Gehe zu **Authentication** → **Settings** → **Multi-Factor Authentication**
2. Aktiviere mindestens eine der folgenden Optionen:
   - **TOTP (Time-based One-Time Password)** - Empfohlen für mobile Apps
   - **SMS** - Für Telefonnummer-basierte Authentifizierung
   - **Phone** - Alternative SMS-Option

**Empfehlung:** Aktiviere zumindest TOTP, da dies die sicherste und benutzerfreundlichste Option ist.

## 📋 Zusammenfassung

### Sofort beheben (Code):
1. ✅ Führe `migration-fix-security-definer-views.sql` aus → Fixes alle ERROR und function_search_path WARN

### Dashboard-Einstellungen (optional, aber empfohlen):
2. ⚙️ Aktiviere "Leaked password protection" in Auth Settings
3. ⚙️ Aktiviere MFA (mindestens TOTP) in Auth Settings

## 🚀 Migration ausführen

1. Öffne das **Supabase Dashboard** → **SQL Editor**
2. Kopiere den Inhalt von `supabase/migration-fix-security-definer-views.sql`
3. Führe das Script aus
4. Prüfe im **Security Advisor**, ob die Fehler behoben sind

Die Auth-Warnungen (Leaked Password, MFA) müssen manuell im Dashboard aktiviert werden, da es sich um Projekt-Einstellungen handelt, die nicht über SQL geändert werden können.

