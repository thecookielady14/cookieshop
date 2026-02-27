# 🛠️ Dein Keks-Shop Spickzettel

Hier findest du eine ganz einfache Erklärung, wie dein Shop "unter der Haube" funktioniert, welche Konten wir angelegt haben und warum. 
*Tipp: Speicher dir hier (lokal auf deinem Rechner) auch gerne deine Passwörter dazu ab.*

---

## 🏗️ 1. Das Fundament: Next.js (Der Code)
Dein Shop ist nicht mehr einfach nur ein Baukasten (wie Shopify), sondern eine maßgeschneiderte Software. Wir nutzen dafür **Next.js**. 
*   **Warum?** Weil es extrem schnell ist, sehr modern aussieht und vor allem: **keine monatlichen Gebühren** wie Shopify kostet.
*   **Wie nutzt du es?** Aktuell läuft der Code nur auf deinem Laptop. Dafür musst du den Terminal öffnen, in den Ordner (`cd /home/rossitto/main_linux/Antigravity/Website/website`) navigieren und dann den Befehl `npm run dev` eingeben. Dann erreichst du den Shop im Browser unter `http://localhost:3000`.
*   **Später:** Am Ende laden wir diesen Code kostenlos bei *Vercel* hoch. Dann ist der Shop weltweit 24/7 erreichbar, auch wenn dein Laptop aus ist.

---

## 💳 2. Die Kasse: Stripe
Stripe ist dein Kassierer. Es ist einer der größten und sichersten Zahlungsanbieter der Welt.
*   **Warum Stripe?** Stripe hat keine monatlichen Fixkosten. Sie nehmen (wie alle anderen auch) nur einen winzigen Prozentsatz, wenn du auch wirklich einen Keks verkaufst. Außerdem übernimmt Stripe den DSGVO-Stress: Sie kümmern sich um sichere Kreditkartenzahlungen, Apple Pay, PayPal und schreiben am Ende sogar vollautomatisch die Rechnung für die Käuferin.
*   **Dein Account:** Du hast dich bei Stripe registriert, um später echtes Geld empfangen zu können. Im Moment steht der Schalter bei Stripe oben noch auf "Testmodus", damit wir beim Ausprobieren nicht aus Versehen echtes Geld hin und her schieben.

---

## 🗄️ 3. Das Lager & Admin-Login: Supabase
Supabase ist unsere "Datenbank". Stell es dir vor wie eine gigantische, super-sichere Excel-Tabelle im Internet.
*   **Warum Supabase?** Dein neuer Shop (Next.js) speichert von sich aus keine Daten dauerhaft. Wenn du einen neuen Keks anlegst (z.B. "Double Choc"), muss dieser Text und das Bild irgendwo gespeichert werden. Genau das macht Supabase. Ebenso speichert es später, welche Person wie viele Kekse bestellt hat.
*   **Das Admin-Login:** Supabase fungiert auch als dein "Türsteher". Wenn du auf `http://localhost:3000/admin/login` gehst, prüft Supabase, ob E-Mail und Passwort stimmen. Nur dann darfst du Kekse anlegen oder löschen.
*   **Deine Aufgabe:** Du hast vorhin in Supabase deinen eigenen Account (unter *Authentication -> Users*) angelegt. Mit genau diesen Daten loggst du dich in deinen Admin-Bereich ein.

---

## 🌐 4. Die Haustür: IONOS
IONOS (ehemals 1&1) ist der "Besitzer" deines Namens im Internet (also deiner Domain, z.B. `thecookielady.de`).
*   **Warum IONOS?** Du hast die Domain dort gekauft. Eine Domain ist wie ein Wegweiser. Im allerletzten Schritt, wenn der Shop von deinem Laptop ins echte Internet (zu Vercel) umgezogen ist, gehen wir zu IONOS und stellen das Schild so ein, dass es auf deinen neuen Shop zeigt. Dann ist die alte Shopify-Verbindung endgültig gekappt und dein neuer Shop ist live.

---
Github:
name: thecookielady14
passwort: Hasenstall6!!




*Dieses Dokument wird im Laufe der Entwicklung immer wieder aktualisiert!*
