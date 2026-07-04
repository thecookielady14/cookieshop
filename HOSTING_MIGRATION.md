# Hosting-Migration: Vercel → Netlify

> **Für die nächste Claude-Session:** Alter Plan (Hetzner + Coolify) wurde verworfen. Neues Ziel ist **Netlify Free** – erlaubt im Gegensatz zu Vercel Hobby kommerzielle Nutzung. DSGVO-Optimierung (DE-Server) ist bewusst keine Priorität. Starte beim STATUS-Block.
>
> **Update 2026-07-04:** Fakten erneut geprüft, Entscheidung für Netlify bestätigt. Netlify hat auf Credit-Billing umgestellt (Details unten). Shop ist live auf Vercel, verkauft aber noch nichts → Migration soll **vor Verkaufsstart** abgeschlossen sein, solange der Umzug risikofrei ist.

---

## ENTSCHEIDUNG & KONTEXT

**Warum weg von Vercel:** Vercel Hobby verbietet explizit kommerzielle Nutzung. Ein E-Commerce-Shop fällt eindeutig darunter. Vercel könnte das Deployment jederzeit sperren.

**Warum Netlify:** Free Tier erlaubt kommerzielle Nutzung. Ähnlicher Workflow wie Vercel (Git-Push → Auto-Deploy). Guter Next.js App Router Support via `@netlify/plugin-nextjs`.

**Warum nicht Hetzner+Coolify:** Zu viel Aufwand und Risiko 3 Wochen vor Launch. Verworfen.

**Warum nicht Cloudflare:** ~~Edge Runtime Quirks~~ (überholt: OpenNext-Adapter 1.0 seit Feb 2026, Node-Runtime, Next.js 16 unterstützt). Aktueller Grund: höherer Migrationsaufwand (Adapter einbauen, `wrangler`-Config, ISR-Caching über KV) und **kein eingebauter `next/image`-Optimierer** (Cloudflare Images kostet extra). Cloudflare bleibt **Plan B**, falls Netlifys Credits knapp werden – Free-Tier dort: 100k Requests/Tag mit täglichem Reset.

**Netlify Free Tier (Stand Juli 2026 – Credit-Billing seit Sept 2025):**
- **300 Credits/Monat mit hartem Limit** – alle Nutzung (Bandbreite, Builds, Functions) zieht aus diesem Topf
- Innerhalb der Credits gelten weiterhin ca.: 100 GB Bandbreite, 300 Build-Minuten, 125.000 Function Invocations, Function Timeout 10 s
- **Achtung:** Sind die Credits aufgebraucht, pausieren alle Sites bis zum Monatsanfang (Shop offline!). Netlify warnt per Mail bei 50/75/90 % Verbrauch – diese Mails ernst nehmen
- Upgrade-Pfad falls nötig: Personal-Plan 9 $/Monat (1.000 Credits, Auto-Recharge möglich)
- Für den Start reicht das Free-Tier mit großem Puffer (realistischer Verbrauch anfangs <5 %)

---

## STATUS / RESUME POINT

**Letztes Update:** 2026-07-04 (Vorprüfungen abgeschlossen, warte auf User für Netlify-Login)

**Aktueller Schritt:** `PHASE_C_WAITING_USER` – Site läuft auf https://thecookielady.netlify.app; warte auf User für: (1) GitHub-Repo im Netlify-Dashboard verknüpfen, (2) Stripe-Webhook anlegen + Signing Secret in .env.local eintragen. (RESEND_API_KEY: geklärt, war nie gesetzt – siehe Env-Block)

**Vorprüfungen (2026-07-04, alle grün):**
- [x] Lokaler Production-Build erfolgreich (`npm run build`, 16 Seiten, TypeScript OK)
- [x] Alle Env-Variablen in `.env.local` vorhanden
- [x] Webhook-Route läuft explizit als Node-Runtime (`export const runtime = 'nodejs'`) – Netlify-kompatibel
- [x] Git-Repo sauber und synchron mit `origin/main`
- [ ] ESLint meldet 41 Fehler – blockiert den Build NICHT (Next 16 lintet nicht im Build), separates Aufräumthema

**Checkliste (von Claude zu pflegen):**
- [x] Phase A: Netlify-Account erstellt, Site `thecookielady` per CLI angelegt, erster Production-Deploy live (04.07.2026, Build 2m17s, Next.js Runtime v5.15.12). **Noch offen: GitHub-Repo im Dashboard verknüpfen** (Site configuration → Build & deploy → Link repository), sonst kein Auto-Deploy bei `git push` – aktuell nur CLI-Deploys
- [x] Phase B: 8 von 9 Env-Variablen per CLI gesetzt; verifiziert: Homepage/Shop/Impressum 200, Admin-Redirect 307→Login, next/image-Optimierung OK. Offen: `STRIPE_WEBHOOK_SECRET` (planmäßig Phase C) und `RESEND_API_KEY` (User prüft Vercel). Hinweis: Shop zeigt keine Produkte – DB ist leer, ist auf Vercel identisch, KEIN Migrationsfehler
- [~] Phase C: Webhook-Endpoint per Stripe-API angelegt (we_1TpPooJZKtqwsQ9w0P9sedTE, nur checkout.session.completed), Secret in Netlify gesetzt. Test-Checkout am 04.07.2026 durchgeführt → **zwei vorbestehende Bugs entdeckt (auch auf Vercel kaputt!):**
  - **Bug 1:** Spalte `customer_name` fehlt in der `orders`-Tabelle, Webhook-INSERT schlägt fehl (42703) → KEINE Bestellung wurde je gespeichert. Fix: `alter table orders add column customer_name text;` in Supabase SQL Editor (USER-AKTION OFFEN)
  - **Bug 2:** Code las Versandadresse von `session.shipping_details` – existiert seit Stripe-API 2025-03-31 nicht mehr (jetzt `collected_information.shipping_details`) → Adresse wäre immer NULL gewesen. Fix in `src/app/api/webhook/route.ts` lokal umgesetzt, muss noch gepusht/deployt werden
  - Stripe wiederholt die fehlgeschlagene Zustellung (evt_1TpPyyJZKtqwsQ9wRkZTfwH7) automatisch bis zu 3 Tage → nach beiden Fixes sollte die Testbestellung automatisch auftauchen
- [ ] Phase D: End-to-End-Test auf Netlify-URL grün (Checkout, Admin, Cart)
- [ ] Phase E: Domain auf Netlify umgestellt, SSL aktiv
- [ ] Phase F: Vercel-Projekt deaktiviert (nach 7 Tagen Beobachtung)

**Vom User einzutragen:**
- Domain: `thecookielady.de` → leitet auf `https://www.thecookielady.de` weiter (per curl bestätigt, 04.07.2026; läuft auf Vercel/fra1). **Phase E: Apex UND www auf Netlify einrichten, www ist kanonisch.**
- Netlify-Site-Name: `thecookielady` → `https://thecookielady.netlify.app` (angelegt 04.07.2026 per CLI, Project ID `20f3c93f-74c1-484a-bb48-6f7d3b7826e6`, Account `kontakt@thecookielady.de`)
- GitHub-Repo-URL: `https://github.com/thecookielady14/cookieshop`

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

**RESEND_API_KEY (geklärt 04.07.2026):** War in Vercel NICHT gesetzt → Bestellbestätigungs-Mails
(src/app/api/webhook/route.ts) wurden in Produktion nie verschickt. Kein Migrationsthema.
**Offenes To-do vor Verkaufsstart:** Resend-Account anlegen, Domain thecookielady.de dort
verifizieren (Code sendet von bestellung@thecookielady.de), RESEND_API_KEY in Netlify setzen.

**Stripe läuft komplett im TESTMODUS (bestätigt 04.07.2026):** Alle Keys sind pk_test/sk_test –
es floss noch nie echtes Geld. Die Migration wird vollständig im Testmodus durchgeführt.
**Weiteres To-do vor Verkaufsstart (unabhängig vom Hosting):** Stripe-Konto für Live-Zahlungen
aktivieren, Live-Keys (pk_live/sk_live) in Netlify setzen, Live-Webhook-Endpoint anlegen
(eigenes whsec_-Secret!), einmal echten Kauf mit kleiner Summe testen.

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
7. **Zeitdruck:** Kein fixes Datum mehr (Launch-Termin 01.06.2026 ist überholt). Stattdessen: Migration **vor Verkaufsstart** abschließen – solange nichts verkauft wird, ist der Umzug risikofrei; sobald Bestellungen laufen, wird Vercels Abschalt-Recht (ToS-Verstoß Hobby-Plan) zum echten Risiko.
8. **Alternative zum Dashboard:** Netlify CLI ist via `npx netlify` verfügbar. Nach einmaligem `npx netlify login` des Users können Site-Anlage (`netlify init`), Env-Variablen (`netlify env:set`) und Deploys per CLI laufen – schneller als Klicken, und Claude kann mehr selbst übernehmen.
