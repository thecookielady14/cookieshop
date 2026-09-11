-- Brücke zwischen Bestellung und Rechnung
--
-- Bestellnummer und Rechnungsnummer sind bewusst verschiedene Zähler:
-- Bestellnummern dürfen Lücken haben (Stornos, fehlgeschlagene Zahlungen,
-- gelöschte Testbestellungen), Rechnungsnummern nicht. Deshalb zählt Stripe
-- eigenständig weiter als die Datenbank.
--
-- Bisher gab es zwischen beiden keinerlei Verbindung: Fragt jemand nach
-- "Rechnung SHOP-0007", ließ sich im Adminbereich nicht nachschlagen, welche
-- Bestellung das war.
--
-- invoice_reference gibt es schon und hält bei Telefonbestellungen die
-- Lexware-Nummer. Dasselbe Feld nimmt ab jetzt auch die Stripe-Nummer auf –
-- es ist dieselbe Angabe, nur aus einer anderen Quelle; woher sie stammt,
-- sagt bereits die Spalte `source`.
--
-- Neu ist nur die Adresse der Rechnung, damit sie sich aus dem Adminbereich
-- heraus öffnen und weitergeben lässt.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS invoice_url TEXT;

COMMENT ON COLUMN public.orders.invoice_reference IS
    'Rechnungsnummer zu dieser Bestellung. Bei source=''phone'' die aus Lexware (von Hand eingetragen), bei source=''online'' die von Stripe vergebene (z. B. SHOP-0007).';

COMMENT ON COLUMN public.orders.invoice_url IS
    'Von Stripe gehostete Rechnung zum Öffnen und Weitergeben. Bei Telefonbestellungen leer – dort liegt die Rechnung als PDF in Lexware.';
