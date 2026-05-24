# Supabase Projekt: byeftmpqmovxikdfajyj

Dieses Projekt nutzt jetzt das Supabase-Projekt unter:

https://supabase.com/dashboard/project/byeftmpqmovxikdfajyj

## 1. API-Keys (Connect → Framework → Next.js)

In `.env.local` und **Vercel → Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://byeftmpqmovxikdfajyj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Oder klassisch:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 2. Datenbank (Prisma) – dein Connection String

Aus Supabase → **Database** → **Connection string** → **Session pooler**:

```
Host:     aws-0-eu-west-1.pooler.supabase.com
Port:     5432
User:     postgres.byeftmpqmovxikdfajyj
Database: postgres
```

In `.env.local`:

```env
DATABASE_URL="postgresql://postgres.byeftmpqmovxikdfajyj:DEIN_PASSWORT@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

Passwort vergessen? → [Database Settings](https://supabase.com/dashboard/project/byeftmpqmovxikdfajyj/settings/database) → **Reset database password**

## 3. Tabellen anlegen

Nach dem Setzen von `DATABASE_URL`:

```bash
npx prisma db push
npm run db:seed
```

Oder SQL im [SQL Editor](https://supabase.com/dashboard/project/byeftmpqmovxikdfajyj/sql/new) aus `prisma/complete-migration.sql` ausführen.

## 4. Vercel

Alle Variablen aus `.env.local` in Vercel eintragen und **Redeploy** auslösen.
