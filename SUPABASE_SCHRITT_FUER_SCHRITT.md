# Supabase Datenbank Setup - Schritt für Schritt

## Schritt 1: Supabase Dashboard öffnen
1. Gehe zu: https://supabase.com/dashboard
2. Logge dich mit deinem Account ein
3. Wähle dein Projekt aus (Projekt-Referenz: `bvsebymssjcazguyukdi`)

## Schritt 2: Prüfe ob die Datenbank pausiert ist
1. Im Dashboard, schaue auf die **linke Seitenleiste**
2. Klicke auf **"Project Settings"** (Zahnrad-Symbol unten links)
3. Klicke auf **"Database"** im linken Menü
4. Schaue nach einem Status wie:
   - ✅ **"Active"** = Datenbank läuft (gut!)
   - ⏸️ **"Paused"** = Datenbank ist pausiert (muss gestartet werden)
   - 🔴 **"Inactive"** = Datenbank ist inaktiv

## Schritt 3: Datenbank starten (falls pausiert)
1. Wenn die Datenbank **pausiert** ist:
   - Klicke auf den Button **"Resume"** oder **"Restore"**
   - Warte 1-2 Minuten bis die Datenbank vollständig gestartet ist
   - Du siehst eine Bestätigung wenn sie aktiv ist

## Schritt 4: Connection String kopieren
1. Bleibe in **Project Settings → Database**
2. Scrolle nach unten zu **"Connection string"** oder **"Connection pooling"**
3. Du siehst mehrere Optionen:
   - **"URI"** - Das ist die direkte Verbindung
   - **"Connection Pooling"** - Das ist die Pooler-Verbindung

### Option A: Direkte Verbindung (empfohlen)
1. Klicke auf den Tab **"URI"**
2. Kopiere den kompletten String (beginnt mit `postgresql://`)
3. Er sollte so aussehen:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres
   ```
4. Ersetze `[YOUR-PASSWORD]` mit deinem tatsächlichen Passwort: `gNpIQDgC3em18YNh`
5. Der finale String sollte sein:
   ```
   postgresql://postgres:gNpIQDgC3em18YNh@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres?sslmode=require
   ```

### Option B: Connection Pooler (Alternative)
1. Klicke auf den Tab **"Connection Pooling"**
2. Wähle **"Session mode"** oder **"Transaction mode"**
3. Kopiere den String
4. Er sollte so aussehen:
   ```
   postgresql://postgres.bvsebymssjcazguyukdi:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
5. Ersetze `[YOUR-PASSWORD]` mit: `gNpIQDgC3em18YNh`
6. Füge `?sslmode=require` am Ende hinzu

## Schritt 5: Connection String in .env.local eintragen
1. Öffne die Datei `.env.local` in deinem Projekt
2. Finde die Zeile mit `DATABASE_URL=`
3. Ersetze den gesamten Wert mit dem kopierten Connection String
4. Stelle sicher, dass er in Anführungszeichen steht:
   ```env
   DATABASE_URL="postgresql://postgres:gNpIQDgC3em18YNh@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres?sslmode=require"
   ```
5. Speichere die Datei

## Schritt 6: Firewall-Einstellungen prüfen
1. Bleibe in **Project Settings → Database**
2. Scrolle zu **"Network Restrictions"** oder **"Connection Pooling"**
3. Prüfe ob deine IP-Adresse blockiert ist
4. Falls nötig, klicke auf **"Allow all IPs"** oder füge deine IP hinzu
5. **WICHTIG**: Für lokale Entwicklung, stelle sicher dass externe Verbindungen erlaubt sind

## Schritt 7: SQL Editor testen (optional)
1. Gehe zurück zum Dashboard (Hauptansicht)
2. Klicke auf **"SQL Editor"** in der linken Seitenleiste
3. Klicke auf **"New query"**
4. Führe einen einfachen Test aus:
   ```sql
   SELECT NOW();
   ```
5. Klicke auf **"Run"** (oder F5)
6. Wenn du ein Ergebnis siehst = Datenbank funktioniert ✅
7. Wenn Fehler = Datenbank ist noch nicht bereit, warte noch 1-2 Minuten

## Schritt 8: Server neu starten
1. Gehe zurück zu deinem Terminal/Command Prompt
2. Stoppe den Server mit **Ctrl+C**
3. Starte neu mit:
   ```bash
   npm run dev
   ```
4. Schaue in die Logs nach:
   - ✅ `[Prisma] Database connection established` = Erfolg!
   - ❌ `Can't reach database server` = Prüfe nochmal Schritt 2-6

## Schritt 9: Fehlerbehebung
Wenn es immer noch nicht funktioniert:

### Prüfe die Projekt-Referenz
1. Gehe zu **Project Settings → General**
2. Schaue nach **"Reference ID"**
3. Stelle sicher, dass es `bvsebymssjcazguyukdi` ist
4. Falls anders, aktualisiere den Connection String entsprechend

### Prüfe das Passwort
1. Gehe zu **Project Settings → Database**
2. Klicke auf **"Reset database password"** falls nötig
3. Kopiere das neue Passwort
4. Aktualisiere `.env.local` mit dem neuen Passwort

### Kontaktiere Supabase Support
Falls nichts funktioniert:
1. Gehe zu **Project Settings → Support**
2. Erstelle ein Support-Ticket
3. Beschreibe das Problem: "Can't reach database server - ENOTFOUND error"

## Zusammenfassung - Checkliste
- [ ] Supabase Dashboard geöffnet
- [ ] Projekt ausgewählt (`bvsebymssjcazguyukdi`)
- [ ] Datenbank-Status geprüft (sollte "Active" sein)
- [ ] Datenbank gestartet (falls pausiert)
- [ ] Connection String kopiert (URI oder Pooler)
- [ ] Passwort im Connection String eingefügt
- [ ] `.env.local` aktualisiert
- [ ] Firewall-Einstellungen geprüft
- [ ] SQL Editor getestet (optional)
- [ ] Server neu gestartet
- [ ] Logs geprüft (Erfolg oder Fehler)

## Wichtige Hinweise
- ⚠️ **Passwort sicher aufbewahren** - nicht in Git committen!
- ⚠️ **Connection String Format**: Muss `?sslmode=require` am Ende haben
- ⚠️ **Datenbank pausiert**: Free Tier pausiert nach 1 Woche Inaktivität
- ⚠️ **IPv6 Problem**: Falls direkte Verbindung nicht funktioniert, nutze Pooler





