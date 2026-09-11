-- Bestellungen im Adminbereich bearbeitbar machen
--
-- Auf public.orders gab es bisher ausschließlich eine SELECT-Regel. Bei
-- eingeschalteter Zeilensicherheit bedeutet eine fehlende UPDATE-Regel nicht
-- "Fehler", sondern "trifft null Zeilen": PostgREST antwortet mit HTTP 200 und
-- einer leeren Liste. Deshalb sah im Adminbereich jede Statusänderung
-- erfolgreich aus und wurde nie gespeichert.
--
-- Der Webhook war davon nie betroffen – er schreibt mit dem Service-Role-
-- Schlüssel, der die Zeilensicherheit umgeht.
--
-- Zwei Absicherungen, die über das reine Erlauben hinausgehen:
--
-- 1. Die Regel gilt für angemeldete Benutzer. Das entspricht den vorhandenen
--    SELECT-Regeln; die Selbstregistrierung ist abgeschaltet, es existiert
--    genau ein Konto.
--
-- 2. Wichtiger: Eine UPDATE-Regel gilt immer für die ganze Zeile. Ohne
--    weitere Einschränkung könnte über den Adminbereich auch der Betrag, die
--    Lieferadresse oder die Stripe-Sitzungs-ID verändert werden – also
--    zahlungsrelevante Daten, die ausschließlich aus dem Webhook stammen
--    dürfen. Deshalb wird das Schreibrecht auf genau die Spalten begrenzt, die
--    im Tagesgeschäft gepflegt werden.

-- Nur die betrieblichen Felder dürfen aus dem Browser heraus geändert werden.
REVOKE UPDATE ON public.orders FROM authenticated;
GRANT UPDATE (
    status,
    tracking_number,
    tracking_carrier,
    invoice_reference,
    invoice_url,
    notes
) ON public.orders TO authenticated;

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
    ON public.orders
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "Admins can update orders" ON public.orders IS
    'Erlaubt das Pflegen von Status, Sendungsnummer, Rechnungsangaben und Notizen aus dem Adminbereich. Welche Spalten tatsächlich beschreibbar sind, regelt zusätzlich das GRANT auf Spaltenebene – Betrag, Adresse und Stripe-Daten bleiben dem Webhook vorbehalten.';
