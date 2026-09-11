-- Sortiment umstrukturieren, Bestellseite – im Supabase SQL Editor ausführen.
-- Setzt product_structure.sql voraus.

-- ---------------------------------------------------------------------------
-- 1. Welche Sorten stecken tatsächlich in einer Bestellposition
-- ---------------------------------------------------------------------------
-- Grundlage der wöchentlichen Backliste ("34x Schoko, 12x Erdnuss").

CREATE TABLE IF NOT EXISTS public.order_item_varieties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  -- Sorte darf gelöscht werden, ohne die Bestellhistorie zu zerstören
  variety_id    UUID REFERENCES public.varieties(id) ON DELETE SET NULL,
  -- Name zum Bestellzeitpunkt: Sorten werden umbenannt, alte Bestellungen nicht
  variety_name  TEXT NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS oiv_item_idx    ON public.order_item_varieties (order_item_id);
CREATE INDEX IF NOT EXISTS oiv_variety_idx ON public.order_item_varieties (variety_id);

ALTER TABLE public.order_item_varieties ENABLE ROW LEVEL SECURITY;
-- Wie order_items: nicht öffentlich lesbar.
DROP POLICY IF EXISTS "Admins can view order item varieties" ON public.order_item_varieties;
CREATE POLICY "Admins can view order item varieties"
  ON public.order_item_varieties FOR SELECT USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 2. Zwischenspeicher für den Checkout
-- ---------------------------------------------------------------------------
-- Stripe erlaubt pro Metadata-Wert 500 Zeichen. Eine Sortenauswahl mit sechs
-- UUIDs sprengt das sofort (allein 216 Zeichen). Deshalb legt die
-- Checkout-Route den serverseitig geprüften Warenkorb hier ab und schickt nur
-- die ID an Stripe.

CREATE TABLE IF NOT EXISTS public.checkout_drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload     JSONB NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS checkout_drafts_created_idx ON public.checkout_drafts (created_at);

-- RLS an, aber absichtlich KEINE Policy: weder anonyme noch angemeldete Konten
-- dürfen hier lesen oder schreiben. Der Zugriff läuft ausschließlich über den
-- Service-Role-Key in /api/checkout und /api/webhook, der RLS umgeht. Mit einer
-- offenen INSERT-Policy könnte sonst jeder Besucher die Tabelle vollschreiben.
ALTER TABLE public.checkout_drafts ENABLE ROW LEVEL SECURITY;

-- Abgebrochene Checkouts hinterlassen Zeilen. Gelegentlich aufräumen:
--   DELETE FROM public.checkout_drafts WHERE created_at < NOW() - INTERVAL '30 days';

-- ---------------------------------------------------------------------------
-- 3. Bestellung atomar schreiben
-- ---------------------------------------------------------------------------
-- Behebt einen bestehenden Fehler: bisher schrieb der Webhook erst orders,
-- dann order_items. Schlug der zweite Schritt fehl, antwortete die Route mit
-- 500, Stripe lieferte erneut aus – und die Idempotenzprüfung fand die bereits
-- angelegte Bestellung und übersprang sie. Die Bestellung blieb dauerhaft ohne
-- Positionen. Mit den Sorten käme eine dritte Schreiboperation dazu und das
-- Zeitfenster würde grösser.
--
-- Jetzt hängt alles in einer Transaktion: entweder komplett oder gar nicht.
-- Rückgabe NULL bedeutet "diese Stripe-Session war schon verarbeitet".

CREATE OR REPLACE FUNCTION public.record_order(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
DECLARE
  v_order_id UUID;
  v_item     JSONB;
  v_item_id  UUID;
BEGIN
  INSERT INTO public.orders (
    customer_name, customer_email, stripe_session_id, total_amount,
    status, source, shipping_address, invoice_reference, notes
  ) VALUES (
    NULLIF(payload->>'customer_name', ''),
    NULLIF(payload->>'customer_email', ''),
    NULLIF(payload->>'stripe_session_id', ''),
    (payload->>'total_amount')::NUMERIC,
    COALESCE(payload->>'status', 'paid'),
    COALESCE(payload->>'source', 'online'),
    payload->'shipping_address',
    NULLIF(payload->>'invoice_reference', ''),
    NULLIF(payload->>'notes', '')
  )
  ON CONFLICT (stripe_session_id) DO NOTHING
  RETURNING id INTO v_order_id;

  -- Kein Rückgabewert heisst: die Session wurde bereits verarbeitet.
  IF v_order_id IS NULL THEN
    RETURN NULL;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'items', '[]'::jsonb))
  LOOP
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_time)
    VALUES (
      v_order_id,
      NULLIF(v_item->>'product_id', '')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC
    )
    RETURNING id INTO v_item_id;

    INSERT INTO public.order_item_varieties (order_item_id, variety_id, variety_name, quantity)
    SELECT
      v_item_id,
      NULLIF(e->>'variety_id', '')::UUID,
      e->>'name',
      (e->>'quantity')::INTEGER
      FROM jsonb_array_elements(COALESCE(v_item->'varieties', '[]'::jsonb)) e
     WHERE COALESCE((e->>'quantity')::INTEGER, 0) > 0
       AND COALESCE(btrim(e->>'name'), '') <> '';
  END LOOP;

  RETURN v_order_id;
END;
$fn$;

COMMENT ON TABLE public.order_item_varieties IS 'Welche Sorten stecken in einer Bestellposition. Grundlage der Backliste.';
COMMENT ON TABLE public.checkout_drafts IS 'Serverseitig geprüftes Warenkorb-Abbild zu einer Stripe-Session. Umgeht das 500-Zeichen-Limit der Stripe-Metadata.';
COMMENT ON FUNCTION public.record_order(JSONB) IS 'Schreibt Bestellkopf, Positionen und Sorten in einer Transaktion. NULL = Stripe-Session war bereits verarbeitet.';
