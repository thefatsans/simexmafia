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

## 2. Datenbank (Prisma)

1. Öffne [Database Settings](https://supabase.com/dashboard/project/byeftmpqmovxikdfajyj/settings/database)
2. **Connection string** → **URI** → **Session pooler** (Port **6543**)
3. Passwort einsetzen und als `DATABASE_URL` speichern

## 3. Tabellen anlegen

Nach dem Setzen von `DATABASE_URL`:

```bash
npx prisma db push
npm run db:seed
```

Oder SQL im [SQL Editor](https://supabase.com/dashboard/project/byeftmpqmovxikdfajyj/sql/new) aus `prisma/complete-migration.sql` ausführen.

## 4. Vercel

Alle Variablen aus `.env.local` in Vercel eintragen und **Redeploy** auslösen.
