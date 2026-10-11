-- Rückverfolgbarkeit (VO (EG) 178/2002 Art. 18) – im Supabase SQL Editor ausführen.
-- Setzt product_structure.sql und order_varieties.sql voraus.
--
-- Die Kette:
--   Zutat (Mehl Typ 405, Marke X)
--     → Zutatencharge (Los des Herstellers + MHD)
--       → Backcharge (L042: Sorte Schoko, gebacken am 11.10.)
--         → Bestellung (Sorte Schoko in Bestellung #1023 kam aus L042)
--
-- Bewusst KEIN Lagerbestand: es wird nur festgehalten, WELCHE Chargen wo
-- stecken, nicht wie viel davon.

-- ---------------------------------------------------------------------------
-- 1. Zutaten (Stammdaten)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ingredients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL CHECK (btrim(name) <> ''),
  supplier   TEXT,
  -- EAN/GTIN vom Packungs-Barcode. Damit erkennt der Handy-Scan die Zutat.
  -- Nicht eindeutig erzwungen: derselbe Artikel kann über zwei Lieferanten
  -- kommen. Der Scan zeigt dann eine Auswahl.
  ean        TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS ingredients_ean_idx ON public.ingredients (ean);

-- ---------------------------------------------------------------------------
-- 2. Zutatenchargen (Wareneingang)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ingredient_lots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- RESTRICT: eine Zutat mit erfassten Chargen darf nicht verschwinden,
  -- sonst reißt die Kette.
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  -- Los-/Chargennummer, wie sie auf der Packung steht
  lot_number    TEXT NOT NULL CHECK (btrim(lot_number) <> ''),
  best_before   DATE,
  received_on   DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Aufgebraucht = erscheint nicht mehr in der Auswahl beim Backen.
  -- Gelöscht wird nichts, die Historie bleibt.
  is_used_up    BOOLEAN NOT NULL DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE (ingredient_id, lot_number)
);

CREATE INDEX IF NOT EXISTS ingredient_lots_ingredient_idx ON public.ingredient_lots (ingredient_id);

-- ---------------------------------------------------------------------------
-- 3. Backchargen
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.bake_batches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Fortlaufende Nummer, die von Hand auf die Etiketten geschrieben wird.
  batch_number INTEGER GENERATED ALWAYS AS IDENTITY UNIQUE,
  -- Anzeigeform L001, L002 … Das „L" verlangt die Los-Kennzeichnung, sofern
  -- die Nummer nicht anders klar erkennbar ist. Ab 1000 einfach vierstellig.
  code         TEXT GENERATED ALWAYS AS (
                 'L' || CASE WHEN batch_number < 1000
                             THEN lpad(batch_number::text, 3, '0')
                             ELSE batch_number::text END
               ) STORED,
  -- Sorte darf gelöscht werden, ohne die Charge zu zerstören (wie order_item_varieties)
  variety_id   UUID REFERENCES public.varieties(id) ON DELETE SET NULL,
  variety_name TEXT NOT NULL,
  baked_on     DATE NOT NULL DEFAULT CURRENT_DATE,
  piece_count  INTEGER CHECK (piece_count IS NULL OR piece_count > 0),
  -- Abgeschlossen = alle Kekse verpackt; taucht beim Packen nicht mehr auf.
  is_closed    BOOLEAN NOT NULL DEFAULT false,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS bake_batches_variety_idx ON public.bake_batches (variety_id);

-- Welche Zutatenchargen stecken in einer Backcharge. Mehrere Chargen derselben
-- Zutat sind ausdrücklich erlaubt (neue Mehlpackung mitten im Backen).
CREATE TABLE IF NOT EXISTS public.bake_batch_lots (
  batch_id   UUID NOT NULL REFERENCES public.bake_batches(id) ON DELETE CASCADE,
  -- RESTRICT: eine verbackene Zutatencharge lässt sich nicht löschen.
  lot_id     UUID NOT NULL REFERENCES public.ingredient_lots(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  PRIMARY KEY (batch_id, lot_id)
);

CREATE INDEX IF NOT EXISTS bake_batch_lots_lot_idx ON public.bake_batch_lots (lot_id);

-- ---------------------------------------------------------------------------
-- 4. Packen: welche Backcharge ging in welche Bestellung
-- ---------------------------------------------------------------------------
-- Hängt an der Sorte einer Bestellposition, weil eine Mischbox mehrere Sorten
-- und damit mehrere Backchargen enthält. Eine Sorte kann auch aus zwei
-- Chargen kommen (drei Kekse aus L041, drei aus L042).

CREATE TABLE IF NOT EXISTS public.order_item_variety_batches (
  order_item_variety_id UUID NOT NULL REFERENCES public.order_item_varieties(id) ON DELETE CASCADE,
  -- RESTRICT: eine ausgelieferte Charge darf nicht gelöscht werden.
  batch_id              UUID NOT NULL REFERENCES public.bake_batches(id) ON DELETE RESTRICT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  PRIMARY KEY (order_item_variety_id, batch_id)
);

CREATE INDEX IF NOT EXISTS oivb_batch_idx ON public.order_item_variety_batches (batch_id);

-- ---------------------------------------------------------------------------
-- 5. Zugriffsrechte (Muster wie bei varieties): nur der angemeldete Admin.
--    Nichts davon ist öffentlich lesbar – Lieferanten und Kundenzuordnung
--    gehen niemanden etwas an.
-- ---------------------------------------------------------------------------

ALTER TABLE public.ingredients                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_lots            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bake_batches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bake_batch_lots            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_variety_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ingredients" ON public.ingredients;
CREATE POLICY "Admins manage ingredients" ON public.ingredients FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage ingredient lots" ON public.ingredient_lots;
CREATE POLICY "Admins manage ingredient lots" ON public.ingredient_lots FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage bake batches" ON public.bake_batches;
CREATE POLICY "Admins manage bake batches" ON public.bake_batches FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage bake batch lots" ON public.bake_batch_lots;
CREATE POLICY "Admins manage bake batch lots" ON public.bake_batch_lots FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage order batches" ON public.order_item_variety_batches;
CREATE POLICY "Admins manage order batches" ON public.order_item_variety_batches FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 6. Backcharge atomar anlegen
-- ---------------------------------------------------------------------------
-- Charge und Zutatenzuordnung in einer Transaktion. Sonst bliebe bei einem
-- Fehler im zweiten Schritt eine Charge ohne Zutaten zurück – und ihre
-- Nummer wäre trotzdem verbraucht.

CREATE OR REPLACE FUNCTION public.create_bake_batch(
  p_variety_id  UUID,
  p_baked_on    DATE,
  p_piece_count INTEGER,
  p_notes       TEXT,
  p_lot_ids     UUID[]
)
RETURNS TABLE (batch_id UUID, batch_code TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
DECLARE
  v_name TEXT;
  v_id   UUID;
  v_code TEXT;
BEGIN
  SELECT v.name INTO v_name FROM public.varieties v WHERE v.id = p_variety_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Sorte nicht gefunden';
  END IF;

  INSERT INTO public.bake_batches (variety_id, variety_name, baked_on, piece_count, notes)
  VALUES (p_variety_id, v_name, COALESCE(p_baked_on, CURRENT_DATE), p_piece_count, NULLIF(btrim(p_notes), ''))
  RETURNING bake_batches.id, bake_batches.code INTO v_id, v_code;

  INSERT INTO public.bake_batch_lots (batch_id, lot_id)
  SELECT v_id, l FROM unnest(COALESCE(p_lot_ids, '{}')) AS l
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT v_id, v_code;
END;
$fn$;

COMMENT ON TABLE public.ingredients IS 'Zutaten-Stammdaten mit EAN für den Handy-Scan.';
COMMENT ON TABLE public.ingredient_lots IS 'Wareneingang: Los-Nummer und MHD je Zutatenpackung.';
COMMENT ON TABLE public.bake_batches IS 'Backcharge. code (L042) wird von Hand auf die Keks-Etiketten geschrieben.';
COMMENT ON TABLE public.bake_batch_lots IS 'Welche Zutatenchargen in einer Backcharge verbacken wurden.';
COMMENT ON TABLE public.order_item_variety_batches IS 'Beim Packen: aus welcher Backcharge die Kekse einer Sorte in einer Bestellung stammen.';
COMMENT ON FUNCTION public.create_bake_batch(UUID, DATE, INTEGER, TEXT, UUID[]) IS 'Legt eine Backcharge samt Zutatenchargen in einer Transaktion an und gibt die neue Nummer (L042) zurück.';
