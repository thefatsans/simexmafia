# Vercel Environment Variables Setup

## 🔴 WICHTIG (für Produktion erforderlich)

### 1. Database
```
DATABASE_URL=postgresql://user:password@host:port/database
```
- **Woher?** Deine PostgreSQL-Datenbank (z.B. Vercel Postgres, Supabase, Neon, etc.)
- **Wichtig:** Ohne diese Variable funktioniert Prisma nicht!

### 2. PayPal (für Zahlungen)
```
NEXT_PUBLIC_PAYPAL_PAYMENT_LINK=https://paypal.me/SimexMafia
```
- **Woher?** PayPal Dashboard → Zahlungslinks erstellen
- **Wichtig:** Für Zahlungen erforderlich! Dies ist dein PayPal-Zahlungslink oder PayPal.me-Link

## 🟡 OPTIONAL (aber empfohlen)

### 3. E-Mail-Versand (Resend)
```
RESEND_API_KEY=re_...
```
- **Woher?** Resend.com Dashboard
- **Wichtig:** Für Registrierungs- und Bestellbestätigungs-E-Mails

### 4. Google OAuth (für Login)
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```
- **Woher?** Google Cloud Console → OAuth 2.0 Client IDs
- **Wichtig:** Für Google-Login

### 5. Website URL
```
NEXT_PUBLIC_SITE_URL=https://simexmafia.com
```
- **Wichtig:** Für E-Mail-Links und SEO

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

- [ ] `DATABASE_URL` gesetzt
- [ ] `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK` gesetzt
- [ ] `RESEND_API_KEY` gesetzt (optional)
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` gesetzt (optional)
- [ ] `NEXT_PUBLIC_SITE_URL` gesetzt
- [ ] Projekt nach dem Hinzufügen der Variablen **redeployed**

## 🚨 Nach dem Hinzufügen:

**Redeploy dein Projekt!** Neue Environment Variables werden nur bei einem neuen Deployment geladen.

1. Gehe zu **Deployments**
2. Klicke auf die drei Punkte (⋯) beim letzten Deployment
3. Wähle **Redeploy**

