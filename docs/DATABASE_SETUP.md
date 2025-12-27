# Datenbank Setup Anleitung

Diese Anleitung erklärt, wie Sie die PostgreSQL-Datenbank für SimexMafia einrichten.

## Option 1: Lokale PostgreSQL-Datenbank

### 1. PostgreSQL installieren

**Windows:**
- Download von [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
- Installer ausführen und PostgreSQL installieren
- Notieren Sie sich das Passwort für den `postgres` Benutzer

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Datenbank erstellen

```bash
# PostgreSQL starten (falls nicht läuft)
# Windows: Services → PostgreSQL starten
# macOS/Linux: sudo systemctl start postgresql

# Datenbank erstellen
psql -U postgres
CREATE DATABASE simexmafia;
\q
```

### 3. DATABASE_URL konfigurieren

Fügen Sie zur `.env.local` hinzu:

```env
DATABASE_URL="postgresql://postgres:IHHR_PASSWORT@localhost:5432/simexmafia?schema=public"
```

Ersetzen Sie `IHHR_PASSWORT` mit Ihrem PostgreSQL-Passwort.

## Option 2: Cloud-Datenbank (Empfohlen für Produktion)

### Vercel Postgres (Kostenlos für Entwicklung)

1. Gehen Sie zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Erstellen Sie ein neues Projekt oder öffnen Sie ein bestehendes
3. Gehen Sie zu **Storage** → **Create Database** → **Postgres**
4. Kopieren Sie die `DATABASE_URL` und fügen Sie sie zur `.env.local` hinzu

### Supabase (Kostenlos für Entwicklung)

1. Gehen Sie zu [https://supabase.com](https://supabase.com)
2. Erstellen Sie ein kostenloses Konto
3. Erstellen Sie ein neues Projekt
4. Gehen Sie zu **Settings** → **Database**
5. Kopieren Sie die **Connection String** (URI)
6. Fügen Sie sie zur `.env.local` hinzu:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Neon (Kostenlos für Entwicklung)

1. Gehen Sie zu [https://neon.tech](https://neon.tech)
2. Erstellen Sie ein kostenloses Konto
3. Erstellen Sie ein neues Projekt
4. Kopieren Sie die Connection String
5. Fügen Sie sie zur `.env.local` hinzu

## Migrationen ausführen

Nachdem die DATABASE_URL konfiguriert ist:

```bash
# Prisma Client generieren
npx prisma generate

# Migrationen erstellen und ausführen
npx prisma migrate dev --name init

# (Optional) Prisma Studio öffnen (GUI für Datenbank)
npx prisma studio
```

## Seed-Daten (Optional)

Um die Datenbank mit Test-Daten zu füllen:

```bash
npx prisma db seed
```

## Wichtige Befehle

```bash
# Prisma Client neu generieren (nach Schema-Änderungen)
npx prisma generate

# Neue Migration erstellen
npx prisma migrate dev --name migration_name

# Migrationen in Produktion ausführen
npx prisma migrate deploy

# Datenbank zurücksetzen (ACHTUNG: Löscht alle Daten!)
npx prisma migrate reset

# Prisma Studio öffnen (GUI)
npx prisma studio
```

## Troubleshooting

### "Can't reach database server"
- Stellen Sie sicher, dass PostgreSQL läuft
- Überprüfen Sie die DATABASE_URL
- Prüfen Sie Firewall-Einstellungen

### "relation does not exist"
- Führen Sie `npx prisma migrate dev` aus
- Oder `npx prisma db push` für schnelle Entwicklung

### "password authentication failed"
- Überprüfen Sie das Passwort in der DATABASE_URL
- Stellen Sie sicher, dass der Benutzer existiert

## Produktion

Für Produktion:
1. Verwenden Sie eine Cloud-Datenbank (Vercel Postgres, Supabase, Neon)
2. Verwenden Sie Connection Pooling
3. Setzen Sie `DATABASE_URL` in den Environment Variables Ihrer Hosting-Plattform
4. Führen Sie `npx prisma migrate deploy` aus





