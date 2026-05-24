# E-Mail einrichten: info@simexmafia.de mit Cloudflare

> **Aktuell:** Support läuft über **simexmafia.support@gmail.com** (siehe `lib/company-info.ts`).  
> Diese Anleitung ist nur relevant, wenn du später eine eigene Domain kaufst.

Mit **Cloudflare Email Routing** (kostenlos) leitest du `info@simexmafia.de` an deine private E-Mail weiter (z. B. Gmail). Du brauchst die Domain **simexmafia.de** bei Cloudflare.

---

## Voraussetzungen

- Domain **simexmafia.de** (bei einem Registrar gekauft)
- Ein Cloudflare-Konto: [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
- Eine Ziel-Adresse, z. B. deine Gmail (`deine@gmail.com`)

> **Hinweis:** Die Website läuft auf `simexmafia.vercel.app`. Für `info@simexmafia.de` muss trotzdem die **.de-Domain** in Cloudflare liegen – das ist unabhängig von Vercel.

---

## Schritt 1: Domain zu Cloudflare hinzufügen

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Add a site**
2. Domain eingeben: `simexmafia.de`
3. Plan: **Free** wählen
4. Cloudflare scannt bestehende DNS-Einträge → **Continue**

---

## Schritt 2: Nameserver umstellen (einmalig)

Cloudflare zeigt dir **2 Nameserver**, z. B.:

- `ada.ns.cloudflare.com`
- `bob.ns.cloudflare.com`

Diese beim **Domain-Registrar** eintragen (wo du simexmafia.de gekauft hast: IONOS, Strato, Namecheap, …):

- Bereich: **DNS / Nameserver / Delegation**
- **Custom nameservers** → Cloudflare-NS eintragen
- Speichern (Propagation kann 5 Min – 48 h dauern, meist unter 1 h)

In Cloudflare steht dann **Active** neben der Domain.

---

## Schritt 3: Email Routing aktivieren

1. Domain **simexmafia.de** in Cloudflare öffnen
2. Linkes Menü: **Email** → **Email Routing**
3. **Get started** / **Enable Email Routing**
4. Cloudflare legt automatisch die nötigen **MX-** und **TXT-**Records an (nicht löschen!)
5. Bestätigung per E-Mail an deine **Ziel-Adresse** (siehe Schritt 4)

---

## Schritt 4: Weiterleitung für info@ anlegen

1. **Email Routing** → **Routing rules** → **Create address**
2. **Custom address:** `info` → wird zu `info@simexmafia.de`
3. **Destination:** deine private E-Mail (z. B. `deine@gmail.com`)
4. Speichern → Cloudflare schickt eine **Bestätigungs-Mail** an die Ziel-Adresse → Link klicken

Optional weitere Adressen:

| Adresse | Zweck |
|---------|--------|
| `info@simexmafia.de` | Support (auf der Website) |
| `kontakt@` | Alias, gleiche Ziel-Adresse |
| `noreply@` | nur wenn du später von Resend sendest (Empfang oft nicht nötig) |

---

## Schritt 5: Testen

1. Von einem **anderen** Postfach eine Mail an `info@simexmafia.de` senden
2. Prüfen, ob sie in der Ziel-Inbox (Gmail) ankommt
3. Spam-Ordner prüfen, falls nichts ankommt

---

## Schritt 6 (optional): Antworten als info@simexmafia.de (Gmail)

Damit Kunden bei Antworten `info@simexmafia.de` sehen:

1. Gmail → **Einstellungen** → **Alle Einstellungen** → **Konten und Import**
2. **E-Mail-Adresse hinzufügen** → `info@simexmafia.de`
3. Gmail sendet Verifizierung → in Cloudflare/Weiterleitung ankommen → bestätigen
4. Beim Antworten: Absender **info@simexmafia.de** wählen

---

## Schritt 7 (optional): System-Mails der Website von info@ senden (Resend)

Wenn du Willkommens-/Bestellmails von `info@` statt `onboarding@resend.dev` senden willst:

1. [Resend](https://resend.com) → **Domains** → `simexmafia.de` hinzufügen
2. Resend zeigt DNS-Einträge (SPF, DKIM) → in **Cloudflare DNS** eintragen
3. Nach Verifizierung in Vercel:

```env
RESEND_FROM_EMAIL=SimexMafia <info@simexmafia.de>
```

4. Redeploy auf Vercel

---

## Häufige Probleme

| Problem | Lösung |
|---------|--------|
| Domain nicht „Active“ | Nameserver beim Registrar prüfen |
| Keine Mail ankommt | MX-Records in Cloudflare DNS prüfen (von Email Routing angelegt) |
| Nur an Resend-Account testbar | Resend-Domain noch nicht verifiziert – Cloudflare ist nur für **Empfang** |
| Website vs. E-Mail | Vercel = Hosting; Cloudflare = DNS + E-Mail für **simexmafia.de** |

---

## Checkliste

- [ ] `simexmafia.de` in Cloudflare (Active)
- [ ] Email Routing aktiviert
- [ ] `info@simexmafia.de` → Ziel-Mail bestätigt
- [ ] Test-Mail empfangen
- [ ] (Optional) Gmail „Senden als info@“
- [ ] (Optional) Resend + `RESEND_FROM_EMAIL` für Website-Mails

Zentrale Adresse im Code: `lib/company-info.ts` → `SUPPORT_EMAIL` / `simexmafia.support@gmail.com`
