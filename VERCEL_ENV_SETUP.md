# Vercel Environment Variables Setup

## 🔴 WICHTIG (für Produktion erforderlich)

### 1. Database (Supabase — Projekt `byeftmpqmovxikdfajyj`)
```
DATABASE_URL=postgresql://postgres.byeftmpqmovxikdfajyj:[DEIN-PASSWORT]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```
- **Woher?** Supabase → Connect → **Transaction pooler** (Port **6543**, nicht 5432 für Vercel!)
- Passwort-Sonderzeichen müssen URL-kodiert sein (`@` → `%40`, `#` → `%23`, …)
- **Wichtig:** Nicht localhost. Nach Deploy: `/api/health` muss `"connected": true` zeigen.
- SQL in Supabase: `prisma/add-sack-open.sql`, `prisma/add-seller-simexmafia.sql`

### 2. Stripe (für Zahlungen — aktuell aktiv)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```
- **Woher?** [Stripe Dashboard](https://dashboard.stripe.com) → API keys
- **Wichtig:** Ohne diese Keys funktioniert Kartenzahlung im Checkout nicht.

### 2b. PayPal (derzeit deaktiviert)
PayPal ist im Checkout **standardmäßig aus**. Nur Stripe wird angezeigt.
```
# NEXT_PUBLIC_PAYPAL_ENABLED=true
# NEXT_PUBLIC_PAYPAL_PAYMENT_LINK=https://paypal.me/SimexMafia
```
- Zum Reaktivieren: `NEXT_PUBLIC_PAYPAL_ENABLED=true` setzen + Payment-Link + Server-Keys (3d)

## 🟡 OPTIONAL (aber empfohlen)

### 3. E-Mail-Versand (Resend) — **Pflicht für Registrierung**
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=SimexMafia <onboarding@resend.dev>
EMAIL_VERIFY_SECRET=ein-langer-zufaelliger-string
PASSWORD_RESET_SECRET=ein-anderer-langer-zufaelliger-string
```
- **Woher?** [Resend.com](https://resend.com) Dashboard → API Keys
- Ohne `RESEND_API_KEY` werden **keine Bestätigungscodes** versendet
- `EMAIL_VERIFY_SECRET` & `PASSWORD_RESET_SECRET` schützen die Code-Hashes (in Production zwingend setzen)

### 3b. Session-Cookie (HMAC) — **Pflicht in Production**
```
SESSION_SECRET=mindestens-32-zeichen-zufaellig
```
- Verwendet von `lib/session-token.ts` für `sm_session`-Cookie (30 Tage)
- Ohne Setzen wird ein unsicheres Default-Secret genutzt → in Production immer überschreiben

### 3c. Captcha (Cloudflare Turnstile) — empfohlen
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```
- Wenn beide gesetzt → Captcha aktiv bei Register / Forgot-Password / Contact
- Leer lassen → Captcha automatisch deaktiviert (Dev-Modus)

### 3d. PayPal Server-Verifizierung
```
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=live   # oder "sandbox"
```
- Benötigt für `/api/payments/paypal/verify` (Orders v2 API). Fehlen die Keys → Route liefert 503.

### 3e. Auto-Lieferung Discord-Server
```
DISCORD_INVITE_URL=https://discord.gg/simex-geheim
```
- Wird bei abgeschlossener Bestellung als „Key“ des Discord-Produkts automatisch ausgeliefert.

### 4. Google OAuth (für Login)
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```
- **Woher?** Google Cloud Console → OAuth 2.0 Client IDs
- **Wichtig:** Für Google-Login

### 5. Website URL & Support-E-Mail
```
NEXT_PUBLIC_SITE_URL=https://simexmafia.vercel.app
NEXT_PUBLIC_CONTACT_EMAIL=simexmafia.support@gmail.com
```
- **Wichtig:** Für E-Mail-Links, Impressum, Kontakt und SEO

### 6. AI Chat (optional)
```
NEXT_PUBLIC_GROQ_API_KEY=...
NEXT_PUBLIC_HUGGINGFACE_API_KEY=...
NEXT_PUBLIC_OPENAI_API_KEY=...
NEXT_PUBLIC_AI_MODEL=gpt-3.5-turbo
```
- **Wichtig:** Nur wenn du den AI-Chat aktivieren willst

## 📝 So fügst du die Variablen in Vercel hinzu:

1. Gehe zu deinem Vercel Dashboard
2. Wähle dein Projekt aus
3. Gehe zu **Settings** → **Environment Variables**
4. Füge jede Variable einzeln hinzu:
   - **Name:** z.B. `DATABASE_URL`
   - **Value:** Dein Wert
   - **Environment:** Wähle "Production", "Preview" und/oder "Development"
5. Klicke auf **Save**
6. **WICHTIG:** Nach dem Hinzufügen neuer Variablen → **Redeploy** dein Projekt!

## ✅ Checkliste:

- [ ] `DATABASE_URL` gesetzt (Transaction Pooler, Port 6543)
- [ ] `SESSION_SECRET` gesetzt (≥32 Zeichen)
- [ ] `RESEND_API_KEY` + `EMAIL_VERIFY_SECRET` + `PASSWORD_RESET_SECRET` gesetzt
- [ ] `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` gesetzt (Pflicht für Kartenzahlung)
- [ ] PayPal optional: `NEXT_PUBLIC_PAYPAL_ENABLED=true` + Link + API-Keys (sonst aus)
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (optional, für Captcha)
- [ ] `DISCORD_INVITE_URL` gesetzt
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` gesetzt (optional)
- [ ] `NEXT_PUBLIC_SITE_URL` gesetzt
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL=simexmafia.support@gmail.com` gesetzt
- [ ] SQL-Migrationen ausgeführt: `prisma/add-sack-open.sql`, `prisma/add-seller-simexmafia.sql`, `prisma/add-email-verification.sql`, `prisma/add-password-reset.sql`, `prisma/add-referrals.sql`
- [ ] Projekt nach dem Hinzufügen der Variablen **redeployed**

## 🚨 Nach dem Hinzufügen:

**Redeploy dein Projekt!** Neue Environment Variables werden nur bei einem neuen Deployment geladen.

1. Gehe zu **Deployments**
2. Klicke auf die drei Punkte (⋯) beim letzten Deployment
3. Wähle **Redeploy**

