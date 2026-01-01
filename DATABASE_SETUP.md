# Datenbank-Setup für SimexMafia

## Problem
Die Bestellungen werden aktuell nur in `localStorage` gespeichert und sind daher nicht zwischen verschiedenen Browsern/Geräten synchronisiert. Um die Datenbank zu nutzen, müssen folgende Schritte ausgeführt werden:

## Schritt 1: DATABASE_URL konfigurieren

1. Erstelle eine `.env.local` Datei im Root-Verzeichnis (falls noch nicht vorhanden):
   ```bash
   # Windows PowerShell
   New-Item -Path .env.local -ItemType File
   ```

2. Füge die `DATABASE_URL` hinzu. Beispiel für PostgreSQL (z.B. Supabase, Neon, oder lokale PostgreSQL):
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   ```

   **Beispiele:**
   - **Supabase**: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
   - **Neon**: `postgresql://[USER]:[PASSWORD]@[ENDPOINT]/[DATABASE]?sslmode=require`
   - **Lokale PostgreSQL**: `postgresql://postgres:password@localhost:5432/simexmafia`

## Schritt 2: Prisma Migrationen ausführen

1. Installiere Dependencies (falls noch nicht geschehen):
   ```bash
   npm install
   ```

2. Generiere Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Führe Migrationen aus:
   ```bash
   npx prisma migrate dev
   ```

   Dies erstellt alle Tabellen in der Datenbank basierend auf `prisma/schema.prisma`.

## Schritt 3: Development Server neu starten

Nach der Konfiguration:
```bash
npm run dev
```

## Schritt 4: Testen

1. Erstelle eine Testbestellung über die Website
2. Öffne das Admin-Panel (`/admin/orders`)
3. Die Bestellung sollte jetzt in der Datenbank gespeichert sein und im Admin-Panel sichtbar sein

## Fehlerbehebung

### Fehler: "Invalid prisma.user.findUnique() invocation"
- **Ursache**: `DATABASE_URL` ist nicht gesetzt oder Prisma Client wurde nicht generiert
- **Lösung**: 
  1. Prüfe, ob `.env.local` existiert und `DATABASE_URL` enthält
  2. Führe `npx prisma generate` aus
  3. Starte den Server neu

### Fehler: "Database connection error"
- **Ursache**: Die Datenbank ist nicht erreichbar oder die Verbindungsdaten sind falsch
- **Lösung**: 
  1. Prüfe die `DATABASE_URL` auf Richtigkeit
  2. Stelle sicher, dass die Datenbank läuft (bei lokaler PostgreSQL)
  3. Prüfe Firewall-Einstellungen (bei Cloud-Datenbanken)

### Bestellungen werden nicht angezeigt
- **Ursache**: Migrationen wurden nicht ausgeführt
- **Lösung**: Führe `npx prisma migrate dev` aus

## Fallback-Verhalten

Wenn `DATABASE_URL` nicht gesetzt ist, verwendet die Anwendung automatisch `localStorage` als Fallback. Bestellungen werden dann nur lokal im Browser gespeichert.

## Nächste Schritte

Nach erfolgreicher Konfiguration:
- Alle Bestellungen werden in der Datenbank gespeichert
- Bestellungen sind von allen Geräten/Browsern aus sichtbar
- Admin-Panel zeigt alle Bestellungen aus der Datenbank
- Bestellungen können von Admins bearbeitet werden





