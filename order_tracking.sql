-- Sendungsnummer zur Bestellung
--
-- Bisher erfuhr die Kundschaft in der Versandmail nur "ist unterwegs" und
-- konnte nichts nachverfolgen. Die Sendungsnummer steht auf dem Beleg des
-- Paketdienstes und wird hier von Hand eingetragen – solange Etiketten am
-- Schalter gekauft werden, gibt es keine andere Quelle dafür.
--
-- Das ist zugleich die Vorarbeit für später: Sobald Etiketten digital über
-- eine Schnittstelle erzeugt werden, füllt dieselbe Spalte sich von selbst,
-- und der Status kann dem Paket folgen statt umgekehrt.
--
-- Der Dienst wird mitgespeichert, weil der Verfolgungslink je Anbieter anders
-- aussieht. Ein falsch geratener Link wäre schlechter als gar keiner.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS tracking_number  TEXT,
    ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;

COMMENT ON COLUMN public.orders.tracking_number IS
    'Sendungsnummer des Pakets, von Hand aus dem Versandbeleg übernommen. Leer, solange nicht verschickt wurde.';

COMMENT ON COLUMN public.orders.tracking_carrier IS
    'Kürzel des Paketdienstes (dhl, hermes, dpd, gls, ups) – bestimmt, wie der Verfolgungslink gebaut wird. Leer bedeutet: Nummer anzeigen, aber nicht verlinken.';
