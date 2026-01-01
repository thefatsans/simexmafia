# Datenbank-Verbindung beheben

## Problem
Die Datenbank ist aktuell nicht erreichbar. Dies kann mehrere Ursachen haben:

## Mögliche Lösungen

### 1. Supabase Firewall prüfen
1. Gehe zu deinem Supabase Dashboard: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Gehe zu **Settings** → **Database**
4. Prüfe die **Connection Pooling** und **Network Restrictions**
5. Stelle sicher, dass deine IP-Adresse nicht blockiert ist
6. Aktiviere **Allow connections from anywhere** (nur für Entwicklung!)

### 2. Connection String prüfen
Der Connection String sollte so aussehen:
```
postgresql://postgres:gNpIQDgC3em18YNh@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres?sslmode=require
```

### 3. Supabase Connection Pooling verwenden
Für bessere Performance und Stabilität, verwende den Connection Pooler:
```
postgresql://postgres.bvsebymssjcazguyukdi:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 4. Migrationen manuell ausführen
Falls die automatische Migration nicht funktioniert:

1. **Prisma Studio öffnen** (für manuelle Datenbank-Inspektion):
   ```bash
   npx prisma studio
   ```

2. **SQL direkt in Supabase ausführen**:
   - Gehe zu Supabase Dashboard → SQL Editor
   - Führe die SQL-Befehle aus `prisma/migrations` manuell aus

### 5. Verbindung testen
Teste die Verbindung mit einem einfachen Tool:
```bash
# Mit psql (falls installiert)
psql "postgresql://postgres:gNpIQDgC3em18YNh@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres?sslmode=require"
```

## Nächste Schritte

1. **Prüfe die Supabase Firewall-Einstellungen**
2. **Teste die Verbindung** mit einem SQL-Client (z.B. DBeaver, pgAdmin)
3. **Falls die Verbindung funktioniert**, führe die Migrationen aus:
   ```bash
   npx prisma migrate dev --name init
   ```

## Fallback
Falls die Datenbank-Verbindung nicht funktioniert, verwendet die Anwendung automatisch `localStorage` als Fallback. Bestellungen werden dann lokal im Browser gespeichert.

## Wichtige Hinweise

- **Nie das Passwort in Git committen!** Die `.env.local` Datei ist bereits in `.gitignore`
- **Für Produktion**: Verwende Environment Variables in Vercel/Deployment-Plattform
- **SSL ist erforderlich**: Supabase erfordert `?sslmode=require` im Connection String





