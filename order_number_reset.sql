-- Bestellnummern-Zähler zurücksetzen
--
-- Nach dem Löschen aller Testbestellungen war die Tabelle leer, der Zähler
-- stand aber bei 1022 – die erste echte Bestellung hätte also #1022 geheißen,
-- ohne dass es je eine #1000 bis #1021 gegeben hätte.
--
-- Das ist nur zulässig, solange keine Bestellung existiert. Nach dem ersten
-- echten Verkauf darf der Zähler nie wieder zurückgesetzt werden: Es würden
-- Nummern doppelt vergeben, und die Zuordnung zu Rechnungen bräche.
--
-- Der DO-Block ist das Sicherheitsnetz dagegen.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.orders) THEN
        RAISE EXCEPTION 'Es gibt bereits Bestellungen – Zähler wird nicht zurückgesetzt.';
    END IF;
    ALTER SEQUENCE order_number_seq RESTART WITH 1000;
END $$;

-- Kontrolle: steht_auf = 1000 und schon_vergeben = false bedeutet,
-- dass die nächste Bestellung die Nummer 1000 bekommt.
SELECT last_value AS steht_auf, is_called AS schon_vergeben FROM order_number_seq;
