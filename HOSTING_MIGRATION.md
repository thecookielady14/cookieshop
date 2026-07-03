# Hosting-Migration: Vercel → Netlify

> **Für die nächste Claude-Session:** Alter Plan (Hetzner + Coolify) wurde verworfen. Neues Ziel ist **Netlify Free** – erlaubt im Gegensatz zu Vercel Hobby kommerzielle Nutzung. DSGVO-Optimierung (DE-Server) ist bewusst keine Priorität. Starte beim STATUS-Block.

---

## ENTSCHEIDUNG & KONTEXT

**Warum weg von Vercel:** Vercel Hobby verbietet explizit kommerzielle Nutzung. Ein E-Commerce-Shop fällt eindeutig darunter. Vercel könnte das Deployment jederzeit sperren.

**Warum Netlify:** Free Tier erlaubt kommerzielle Nutzung. Ähnlicher Workflow wie Vercel (Git-Push → Auto-Deploy). Guter Next.js App Router Support via `@netlify/plugin-nextjs`.

**Warum nicht Hetzner+Coolify:** Zu viel Aufwand und Risiko 3 Wochen vor Launch. Verworfen.

**Warum nicht Cloudflare Pages:** Edge Runtime hat bekannte Quirks mit `force-dynamic`, `@supabase/ssr` und Stripe Raw-Body. Mehr Debugging-Risiko.

**Netlify Free Tier Limits (reichen für den Start locker):**
- 100 GB Bandbreite/Monat
- 300 Build-Minuten/Monat
- 125.000 Serverless Function Invocations/Monat
- Function Timeout: 10 Sekunden

---

## STATUS / RESUME POINT

**Letztes Update:** 2026-05-13 (Plan fertig, noch nicht gestartet)

**Aktueller Schritt:** `PHASE_A_NOT_STARTED`

**Checkliste (von Claude zu pflegen):**
- [ ] Phase A: Netlify-Account erstellt, Repo verbunden, erstes Build erfolgreich
- [ ] Phase B: Alle Env-Variablen in Netlify gesetzt
- [ ] Phase C: Stripe-Webhook auf Netlify-Preview-URL umgestellt + getestet
- [ ] Phase D: End-to-End-Test auf Netlify-URL grün (Checkout, Admin, Cart)
- [ ] Phase E: Domain auf Netlify umgestellt, SSL aktiv
- [ ] Phase F: Vercel-Projekt deaktiviert (nach 7 Tagen Beobachtung)

**Vom User einzutragen:**
- Domain: `_________________`
- Netlify-Site-Name (auto-generiert oder custom): `_________________`
- GitHub-Repo-URL: `_________________`

---

## KRITISCHE PROJEKT-FAKTEN (für Claude)

**Dateien vor dem ersten Schritt lesen:**
- `next.config.ts` – `remotePatterns` für Supabase-Storage
- `src/app/api/webhook/route.ts` – `req.text()` für Raw-Body (wichtig: muss als Node.js Function laufen, nicht Edge)
- `src/middleware.ts` – Supabase Auth SSR

**Environment Variables (alle müssen in Netlify gesetzt werden):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_BASE_URL          ← MUSS auf Netlify-URL geändert werden
SUPABASE_SERVICE_ROLE_KEY
STRIPE_WEBHOOK_SECRET         ← MUSS neu generiert werden (Phase C)
NOTIFY_SHIPPED_SECRET
NEXT_PUBLIC_NOTIFY_SECRET
```

---

## PHASE A: Netlify aufsetzen & erstes Build

**Ziel:** App baut erfolgreich auf Netlify, erreichbar unter `https://<site-name>.netlify.app`.

A1. **netlify.com** → "Sign up" → "Sign up with GitHub"

A2. **"Add new site" → "Import an existing project" → GitHub**
   - Repo auswählen
   - Branch: `main`
   - Build command: `npm run build` (wird auto-erkannt)
   - Publish directory: `.next` (wird auto-erkannt)
   - **Deploy** klicken

A3. Netlify installiert automatisch `@netlify/plugin-nextjs` – das Plugin übersetzt App Router, Server Components, API Routes und Middleware in Netlify Functions. Nichts manuell konfigurieren.

A4. **Build-Log beobachten.** Häufige Fehler und Lösungen:
   - `Error: Missing env var` → Env-Variablen noch nicht gesetzt (Phase B), erstes Build schlägt fehl – normal
   - Lint-Fehler → `npm run lint` lokal fixen

**Verifikation:** Build-Status grün. Auch wenn die App noch nicht richtig läuft (fehlende Envs), muss das Build selbst durchlaufen.

---

## PHASE B: Environment Variables setzen

**Ziel:** App startet mit korrekter Konfiguration.

B1. **Netlify Dashboard → Site → Site configuration → Environment variables → Add variable**

B2. Alle Variablen aus Vercel übertragen. Ausnahmen:
   - `NEXT_PUBLIC_BASE_URL` = `https://<site-name>.netlify.app` (vorerst, bis Domain umgestellt)
   - `STRIPE_WEBHOOK_SECRET` = vorerst leer lassen (wird in Phase C gesetzt)

B3. **Redeploy triggern:** Deploys → "Trigger deploy" → "Deploy site"

**Verifikation:**
- `https://<site-name>.netlify.app` lädt die Homepage
- Shop-Seite zeigt Produkte (Supabase-Verbindung OK)
- Produktbilder laden (Supabase Storage via `next/image`)

---

## PHASE C: Stripe-Webhook umstellen & testen

**Ziel:** Checkout funktioniert End-to-End auf der Netlify-URL.

C1. **Stripe Dashboard → Developers → Webhooks → Add endpoint**
   - URL: `https://<site-name>.netlify.app/api/webhook`
   - Event: `checkout.session.completed`
   - **Signing Secret** kopieren

C2. **In Netlify:** `STRIPE_WEBHOOK_SECRET` mit neuem Secret setzen → Redeploy

C3. **Test-Event:**
   - Stripe → Webhook → "Send test webhook" → `checkout.session.completed`
   - Netlify Functions Log prüfen (Netlify Dashboard → Functions → webhook): Status 200?

C4. **Echter End-to-End-Test:**
   - Produkt → Warenkorb → Checkout
   - Stripe-Testkarte: `4242 4242 4242 4242`, CVC `123`, beliebiges Datum
   - `/success` lädt, Warenkorb leer
   - Supabase → `orders` + `order_items`: neue Zeilen vorhanden

**Verifikation:** Vollständiger Checkout-Flow auf Netlify-URL grün.

---

## PHASE D: Admin & vollständiger Funktionstest

**Ziel:** Alle Features durchgetestet, keine versteckten Fehler.

D1. **Admin-Login:** `https://<site-name>.netlify.app/admin/login` → Supabase Auth funktioniert?
   - Falls nicht: Supabase → Authentication → URL Configuration → Redirect URLs: `https://<site-name>.netlify.app/**` hinzufügen

D2. **Admin-Dashboard:** Produkte, Bestellungen, Kunden laden?

D3. **`/api/notify-shipped`** manuell testen:
   ```bash
   curl -X POST https://<site-name>.netlify.app/api/notify-shipped \
     -H "Authorization: Bearer <NOTIFY_SHIPPED_SECRET>"
   ```

D4. **Framer Motion / Client-seitige Features:** Animationen, Warenkorb-State (Zustand + localStorage) funktionieren im Browser?

D5. **Function Timeout prüfen:** Falls `/api/checkout` oder Supabase-Queries >10s brauchen → in `netlify.toml` Timeout erhöhen:
   ```toml
   [functions]
     timeout = 26
   ```

**Verifikation:** Alle Punkte grün → bereit für Domain-Umstellung.

---

## PHASE E: Domain umstellen

**Ziel:** `https://<domain>` zeigt auf Netlify statt Vercel.

E1. **Netlify → Domain management → Add a domain** → eigene Domain eingeben

E2. **DNS-Records beim Registrar anpassen:**
   - Netlify zeigt exakt welche Records gesetzt werden müssen (A oder CNAME)
   - Vercel-spezifische DNS-Einträge entfernen

E3. **SSL:** Netlify holt automatisch Let's Encrypt Zertifikat sobald DNS propagiert ist

E4. **Environment Variable aktualisieren:**
   - `NEXT_PUBLIC_BASE_URL` = `https://<domain>` → Redeploy

E5. **Supabase Site URL aktualisieren:**
   - Supabase → Auth → URL Configuration → Site URL = `https://<domain>`
   - Redirect URLs: `https://<domain>/**` hinzufügen

E6. **Stripe Webhook auf Production-Domain umstellen:**
   - Neuen Endpoint anlegen: `https://<domain>/api/webhook`
   - Neues Signing Secret → in Netlify setzen → Redeploy
   - Alten Netlify-Subdomain-Webhook deaktivieren

**Verifikation:** `https://<domain>` lädt mit gültigem SSL, kompletter Checkout-Flow nochmal testen.

---

## PHASE F: Vercel deaktivieren

**NICHT VOR:** 7 Tage stabiler Betrieb auf Netlify.

F1. 7 Tage beobachten: Netlify-Deploys, Function-Logs, keine 5xx-Errors
F2. **Vercel Dashboard → Project → Settings → Advanced → Delete Project**
F3. Alten Stripe-Webhook (Vercel-URL) löschen

---

## ROLLBACK

Falls irgendwas brennt nach Domain-Umstellung:

1. DNS-Records zurück auf Vercel-IP (Vercel-Projekt muss noch aktiv sein)
2. Stripe-Webhook zurück auf Vercel-URL
3. Supabase Site URL zurück auf Vercel-URL
4. **Daten bleiben in Supabase** – Netlify war nur Compute

→ Deshalb Vercel erst nach 7 Tagen löschen (Phase F).

---

## KOSTEN

| Posten | Kosten/Mo |
|---|---|
| Netlify Free | 0 € |
| Supabase Free | 0 € |
| Stripe | nur Tx-Fees |
| **Summe** | **0 €** (vs. ~$20 Vercel Pro) |

---

## ANWEISUNG AN ZUKÜNFTIGE CLAUDE-SESSION

1. **Lies zuerst STATUS / RESUME POINT** – starte da, nicht von vorne
2. **Frage nach fehlenden User-Werten** (Domain, Site-Name) bevor du loslegst
3. **Pro Phase:** Kurz erklären was passiert, dann Schritt-für-Schritt. User führt Klicks selbst aus.
4. **Nach jeder Phase:** Checkliste aktualisieren
5. **Code-Änderungen sind minimal** – nur `netlify.toml` falls nötig (Function-Timeout). Kein App-Code anfassen.
6. **Bei Fehlern:** Netlify Function Log lesen (Dashboard → Functions), dann fragen. Nicht raten.
7. **Zeitdruck:** Launch ist 01.06.2026. Migration muss spätestens 27.05. durch sein um 5 Tage Puffer zu haben.
