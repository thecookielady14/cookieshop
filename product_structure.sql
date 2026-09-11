-- Sortiment umstrukturieren, Teil 1 von 2 – im Supabase SQL Editor ausführen.
--
-- Aus einer flachen Produkttabelle werden drei Ebenen:
--   Linie (product_lines) -> Sorte/Rezept (varieties) -> verkaufbare Einheit (products)
--
-- products bleibt bewusst die verkaufbare Einheit (Karton, Tüte, Packung).
-- Dadurch bleiben order_items.product_id, die Preisprüfung im Checkout und die
-- Sitemap im Kern erhalten.
--
-- Diese Migration ist ADDITIV: die alten Rezeptspalten in products bleiben
-- vorerst stehen, damit der bestehende Shop zwischendurch lauffähig bleibt.
-- Entfernt werden sie erst in product_structure_cleanup.sql, wenn der Code
-- umgestellt ist.

-- ---------------------------------------------------------------------------
-- 1. Produktlinien
-- ---------------------------------------------------------------------------
-- Bewusst rein darstellend: Verhalten (fest/konfigurierbar) hängt am Produkt,
-- nicht an der Linie. Sonst könnte die Classic Line nicht gleichzeitig einen
-- Konfigurator-Karton und fertige Kartons enthalten.

CREATE TABLE IF NOT EXISTS public.product_lines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Teil der Adresse: /shop/classic
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  tagline     TEXT,
  description TEXT,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.product_lines DROP CONSTRAINT IF EXISTS product_lines_slug_format;
ALTER TABLE public.product_lines ADD CONSTRAINT product_lines_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- ---------------------------------------------------------------------------
-- 2. Sorten – hier liegt das Rezept und damit die LMIV-Kennzeichnung
-- ---------------------------------------------------------------------------
-- Eine Sorte wird NIE direkt verkauft. Sie steckt in einem oder mehreren
-- Produkten (sortenreiner Karton, Probierkarton, Konfigurator) – deshalb wird
-- das Rezept genau einmal gepflegt und nicht je Karton wiederholt.

CREATE TABLE IF NOT EXISTS public.varieties (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id            UUID NOT NULL REFERENCES public.product_lines(id) ON DELETE RESTRICT,
  name               TEXT NOT NULL,              -- Marketingname: "Double Choc Fudge"
  legal_name         TEXT,                       -- LMIV-Bezeichnung der Sorte
  description        TEXT,
  ingredients        TEXT,
  allergens          TEXT,
  consumer_info      TEXT,
  -- Gewicht EINES Kekses. Daraus wird die Nettofüllmenge eines Kartons
  -- berechnet – bei gemischten Kartons gibt es kein festes Kartongewicht.
  piece_weight_grams NUMERIC(6,1),
  image_url          TEXT,
  is_available       BOOLEAN NOT NULL DEFAULT false,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  -- Nährwerte je 100 g (optional)
  energy_kj          NUMERIC(8,1),
  energy_kcal        NUMERIC(8,1),
  fat_g              NUMERIC(6,1),
  saturated_fat_g    NUMERIC(6,1),
  carbs_g            NUMERIC(6,1),
  sugar_g            NUMERIC(6,1),
  protein_g          NUMERIC(6,1),
  salt_g             NUMERIC(6,2),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS varieties_line_idx ON public.varieties (line_id, sort_order);

-- Dieselbe Rechtsregel wie bisher bei products, nur eine Ebene tiefer.
ALTER TABLE public.varieties DROP CONSTRAINT IF EXISTS varieties_lmiv_complete;
ALTER TABLE public.varieties ADD CONSTRAINT varieties_lmiv_complete CHECK (
  is_available IS NOT TRUE
  OR (
        legal_name  IS NOT NULL AND btrim(legal_name)  <> ''
    AND ingredients IS NOT NULL AND btrim(ingredients) <> ''
    AND allergens   IS NOT NULL AND btrim(allergens)   <> ''
    AND piece_weight_grams IS NOT NULL AND piece_weight_grams > 0
  )
);

-- ---------------------------------------------------------------------------
-- 3. products wird zur verkaufbaren Einheit
-- ---------------------------------------------------------------------------

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS line_id UUID
  REFERENCES public.product_lines(id) ON DELETE RESTRICT;

-- 'fixed'        = feste Zusammenstellung (sortenrein oder Probierkarton)
-- 'configurable' = Kundschaft stellt die Sorten selbst zusammen
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_kind_check;
ALTER TABLE public.products ADD CONSTRAINT products_kind_check
  CHECK (kind IN ('fixed', 'configurable'));

-- Stückzahl der Einheit. Nullable, weil eine Tüte auch nach Gewicht statt nach
-- Stück verkauft werden kann. Beim Konfigurator ist sie dagegen zwingend –
-- ohne Zielzahl ließe sich "stell dir etwas zusammen" nicht prüfen.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS piece_count INTEGER;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_piece_count_check;
ALTER TABLE public.products ADD CONSTRAINT products_piece_count_check
  CHECK (piece_count IS NULL OR piece_count > 0);
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_configurable_needs_pieces;
ALTER TABLE public.products ADD CONSTRAINT products_configurable_needs_pieces
  CHECK (kind <> 'configurable' OR (piece_count IS NOT NULL AND piece_count > 0));

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_line_idx ON public.products (line_id, sort_order);

-- weight_grams ist ab jetzt nur noch die DEKLARIERTE Nennfüllmenge (für Ware,
-- die nach Gewicht verkauft wird). Bei Stückware wird die Nettofüllmenge aus
-- den Sorten gerechnet, weil ein gemischter Karton kein festes Gewicht hat.
ALTER TABLE public.products ALTER COLUMN weight_grams DROP NOT NULL;

-- Der alte CHECK verlangte Zutaten und Allergene am Produkt. Die liegen jetzt
-- bei den Sorten; die Prüfung übernimmt der Trigger in Abschnitt 5, weil sie
-- über Tabellengrenzen geht.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_lmiv_complete;

-- ---------------------------------------------------------------------------
-- 4. Welche Sorte steckt wie oft in einem festen Produkt
-- ---------------------------------------------------------------------------
-- Sortenrein    = eine Zeile mit quantity = piece_count
-- Probierkarton = sechs Zeilen mit quantity = 1
-- Konfigurierbar = gar keine Zeilen, die Auswahl kommt aus der Linie

CREATE TABLE IF NOT EXISTS public.product_varieties (
  product_id UUID NOT NULL REFERENCES public.products(id)  ON DELETE CASCADE,
  variety_id UUID NOT NULL REFERENCES public.varieties(id) ON DELETE RESTRICT,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (product_id, variety_id)
);

CREATE INDEX IF NOT EXISTS product_varieties_variety_idx
  ON public.product_varieties (variety_id);

-- ---------------------------------------------------------------------------
-- 5. LMIV-Prüfung über Tabellengrenzen
-- ---------------------------------------------------------------------------
-- Ein CHECK kann keine andere Tabelle lesen. Die Regel lautet:
--   Ein Produkt darf nur bestellbar sein, wenn es eine eigene Bezeichnung hat,
--   die Füllmenge bestimmbar ist und alle beteiligten Sorten vollständig
--   gekennzeichnet und freigegeben sind.
--
-- Die Trigger sind DEFERRABLE INITIALLY DEFERRED und feuern erst beim COMMIT.
-- Das ist notwendig: Produkt und Zusammensetzung werden zusammen geschrieben
-- (siehe admin_save_product), und beim Einfügen des Produkts existieren die
-- Sortenzeilen noch nicht.
--
-- Die Fehlertexte enthalten absichtlich den Marker 'products_lmiv_complete',
-- damit die Fehlerbehandlung im Adminbereich sie als Kennzeichnungsproblem
-- erkennt und verständlich übersetzt.

CREATE OR REPLACE FUNCTION public.assert_product_lmiv(p_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  p        RECORD;
  v_count  INTEGER;
  v_sum    INTEGER;
  v_broken TEXT;
BEGIN
  SELECT * INTO p FROM public.products WHERE id = p_product_id;

  -- Entwürfe dürfen lückenhaft sein; gesperrt wird nur die Veröffentlichung.
  IF NOT FOUND OR p.is_available IS NOT TRUE THEN
    RETURN;
  END IF;

  IF p.legal_name IS NULL OR btrim(p.legal_name) = '' THEN
    RAISE EXCEPTION 'products_lmiv_complete: Die Bezeichnung des Lebensmittels fehlt.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF p.line_id IS NULL THEN
    RAISE EXCEPTION 'products_lmiv_complete: Dem Artikel ist keine Linie zugeordnet.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Füllmenge: entweder Stückware (dann aus den Sorten gerechnet) oder eine
  -- deklarierte Nennfüllmenge. Eines von beidem muss vorhanden sein.
  IF p.piece_count IS NULL AND COALESCE(p.weight_grams, 0) <= 0 THEN
    RAISE EXCEPTION 'products_lmiv_complete: Weder Stückzahl noch Nettofüllmenge angegeben.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF p.kind = 'fixed' THEN
    SELECT count(*), COALESCE(sum(pv.quantity), 0)
      INTO v_count, v_sum
      FROM public.product_varieties pv
     WHERE pv.product_id = p.id;

    IF v_count = 0 THEN
      RAISE EXCEPTION 'products_lmiv_complete: Dem Artikel ist keine Sorte zugeordnet.'
        USING ERRCODE = 'check_violation';
    END IF;

    IF p.piece_count IS NOT NULL AND v_sum <> p.piece_count THEN
      RAISE EXCEPTION 'products_lmiv_complete: Die Sortenmengen ergeben % statt % Stück.', v_sum, p.piece_count
        USING ERRCODE = 'check_violation';
    END IF;

    -- Sorten müssen zur Linie des Produkts gehören …
    SELECT string_agg(v.name, ', ') INTO v_broken
      FROM public.product_varieties pv
      JOIN public.varieties v ON v.id = pv.variety_id
     WHERE pv.product_id = p.id AND v.line_id <> p.line_id;
    IF v_broken IS NOT NULL THEN
      RAISE EXCEPTION 'products_lmiv_complete: Diese Sorten gehören zu einer anderen Linie: %', v_broken
        USING ERRCODE = 'check_violation';
    END IF;

    -- … und freigegeben sein. Dadurch erbt das Produkt die vollständige
    -- Kennzeichnung, ohne sie hier erneut prüfen zu müssen.
    SELECT string_agg(v.name, ', ') INTO v_broken
      FROM public.product_varieties pv
      JOIN public.varieties v ON v.id = pv.variety_id
     WHERE pv.product_id = p.id AND v.is_available IS NOT TRUE;
    IF v_broken IS NOT NULL THEN
      RAISE EXCEPTION 'products_lmiv_complete: Diese Sorten sind nicht freigegeben oder unvollständig gekennzeichnet: %', v_broken
        USING ERRCODE = 'check_violation';
    END IF;

  ELSE
    -- Beim Konfigurator hängen die Sorten an der Linie, nicht am Produkt.
    SELECT count(*) INTO v_count
      FROM public.varieties v
     WHERE v.line_id = p.line_id AND v.is_available IS TRUE;

    IF v_count = 0 THEN
      RAISE EXCEPTION 'products_lmiv_complete: In dieser Linie ist keine Sorte freigegeben – der Karton wäre leer.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.trg_products_lmiv() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN PERFORM public.assert_product_lmiv(NEW.id); RETURN NULL; END; $fn$;

CREATE OR REPLACE FUNCTION public.trg_product_varieties_lmiv() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN PERFORM public.assert_product_lmiv(COALESCE(NEW.product_id, OLD.product_id)); RETURN NULL; END; $fn$;

DROP TRIGGER IF EXISTS products_lmiv_check ON public.products;
CREATE CONSTRAINT TRIGGER products_lmiv_check
  AFTER INSERT OR UPDATE ON public.products
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_products_lmiv();

DROP TRIGGER IF EXISTS product_varieties_lmiv_check ON public.product_varieties;
CREATE CONSTRAINT TRIGGER product_varieties_lmiv_check
  AFTER INSERT OR UPDATE OR DELETE ON public.product_varieties
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_product_varieties_lmiv();

-- Gegenrichtung: wird eine Sorte gesperrt, fallen die abhängigen Produkte
-- automatisch mit aus dem Verkauf. Ein Fehler wäre hier falsch – sonst müsste
-- man vor dem Sperren einer ausverkauften Sorte erst von Hand alle Kartons
-- depublizieren. So ist nie ein Karton im Shop, dessen Inhalt nicht mehr
-- gekennzeichnet ist.
CREATE OR REPLACE FUNCTION public.trg_varieties_cascade() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF NEW.is_available IS NOT TRUE AND OLD.is_available IS TRUE THEN
    -- Feste Zusammenstellungen mit dieser Sorte: sofort aus dem Verkauf.
    UPDATE public.products p
       SET is_available = false, updated_at = TIMEZONE('utc'::text, NOW())
     WHERE p.is_available
       AND p.kind = 'fixed'
       AND EXISTS (SELECT 1 FROM public.product_varieties pv
                    WHERE pv.product_id = p.id AND pv.variety_id = NEW.id);

    -- Konfigurierbare Kartons nur, wenn in der Linie nichts mehr übrig ist.
    UPDATE public.products p
       SET is_available = false, updated_at = TIMEZONE('utc'::text, NOW())
     WHERE p.is_available
       AND p.kind = 'configurable'
       AND p.line_id = NEW.line_id
       AND NOT EXISTS (SELECT 1 FROM public.varieties v
                        WHERE v.line_id = NEW.line_id AND v.is_available);
  END IF;
  RETURN NULL;
END; $fn$;

DROP TRIGGER IF EXISTS varieties_deactivate_cascade ON public.varieties;
CREATE TRIGGER varieties_deactivate_cascade
  AFTER UPDATE OF is_available ON public.varieties
  FOR EACH ROW EXECUTE FUNCTION public.trg_varieties_cascade();

-- ---------------------------------------------------------------------------
-- 6. Produkt und Zusammensetzung in einem Rutsch speichern
-- ---------------------------------------------------------------------------
-- Über die REST-Schnittstelle wären das zwei Anfragen und damit zwei
-- Transaktionen – das Produkt wäre gespeichert, die Sorten womöglich nicht.
-- Diese Funktion klammert beides. SECURITY INVOKER: die Rechteprüfung bleibt
-- bei RLS, es dürfen also weiterhin nur angemeldete Konten schreiben.

CREATE OR REPLACE FUNCTION public.admin_save_product(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
DECLARE
  v_id UUID := NULLIF(payload->>'id', '')::UUID;
BEGIN
  IF v_id IS NULL THEN
    INSERT INTO public.products (
      name, description, price, legal_name, consumer_info, weight_grams,
      image_url, line_id, kind, piece_count, sort_order, is_bestseller, is_available
    ) VALUES (
      payload->>'name',
      payload->>'description',
      (payload->>'price')::NUMERIC,
      NULLIF(payload->>'legal_name', ''),
      NULLIF(payload->>'consumer_info', ''),
      NULLIF(payload->>'weight_grams', '')::INTEGER,
      NULLIF(payload->>'image_url', ''),
      (payload->>'line_id')::UUID,
      COALESCE(payload->>'kind', 'fixed'),
      NULLIF(payload->>'piece_count', '')::INTEGER,
      COALESCE((payload->>'sort_order')::INTEGER, 0),
      COALESCE((payload->>'is_bestseller')::BOOLEAN, false),
      COALESCE((payload->>'is_available')::BOOLEAN, false)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.products SET
      name          = payload->>'name',
      description   = payload->>'description',
      price         = (payload->>'price')::NUMERIC,
      legal_name    = NULLIF(payload->>'legal_name', ''),
      consumer_info = NULLIF(payload->>'consumer_info', ''),
      weight_grams  = NULLIF(payload->>'weight_grams', '')::INTEGER,
      -- Kein neues Bild hochgeladen? Dann das alte behalten.
      image_url     = COALESCE(NULLIF(payload->>'image_url', ''), image_url),
      line_id       = (payload->>'line_id')::UUID,
      kind          = COALESCE(payload->>'kind', 'fixed'),
      piece_count   = NULLIF(payload->>'piece_count', '')::INTEGER,
      sort_order    = COALESCE((payload->>'sort_order')::INTEGER, 0),
      is_bestseller = COALESCE((payload->>'is_bestseller')::BOOLEAN, false),
      is_available  = COALESCE((payload->>'is_available')::BOOLEAN, false),
      updated_at    = TIMEZONE('utc'::text, NOW())
    WHERE id = v_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Der Verkaufsartikel % wurde nicht gefunden.', v_id;
    END IF;
  END IF;

  DELETE FROM public.product_varieties WHERE product_id = v_id;

  IF COALESCE(payload->>'kind', 'fixed') = 'fixed' THEN
    INSERT INTO public.product_varieties (product_id, variety_id, quantity)
    SELECT v_id, (e->>'variety_id')::UUID, (e->>'quantity')::INTEGER
      FROM jsonb_array_elements(COALESCE(payload->'varieties', '[]'::jsonb)) e
     WHERE (e->>'quantity')::INTEGER > 0;
  END IF;

  -- Die Constraint-Trigger feuern jetzt, beim COMMIT dieser Transaktion.
  RETURN v_id;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 7. Zugriffsrechte (Muster wie bei products und shop_settings)
-- ---------------------------------------------------------------------------

ALTER TABLE public.product_lines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varieties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_varieties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lines are viewable by everyone" ON public.product_lines;
CREATE POLICY "Lines are viewable by everyone"
  ON public.product_lines FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage lines" ON public.product_lines;
CREATE POLICY "Admins manage lines" ON public.product_lines FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Varieties are viewable by everyone" ON public.varieties;
CREATE POLICY "Varieties are viewable by everyone"
  ON public.varieties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage varieties" ON public.varieties;
CREATE POLICY "Admins manage varieties" ON public.varieties FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Product varieties are viewable by everyone" ON public.product_varieties;
CREATE POLICY "Product varieties are viewable by everyone"
  ON public.product_varieties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage product varieties" ON public.product_varieties;
CREATE POLICY "Admins manage product varieties" ON public.product_varieties FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 8. Die drei Linien anlegen
-- ---------------------------------------------------------------------------

INSERT INTO public.product_lines (slug, name, tagline, description, sort_order, is_active)
VALUES
  ('classic', 'Classic Line',
   'Die Klassiker – im Sechserkarton, selbst zusammengestellt',
   'Handgeformte Kekse aus regionalem Dinkelmehl. Stell dir deinen Karton selbst zusammen oder greif zu einer fertigen Auswahl.',
   10, true),
  ('athletic', 'Athletic Line',
   'Proteinkekse für nach dem Training',
   'Mehr Eiweiß, derselbe Anspruch an Geschmack. Jede Sorte einzeln in ihrer eigenen Packung.',
   20, true),
  ('kids', 'Kids Line',
   'Ohne zugesetzten Zucker, klein und knusprig',
   'Kleine Kekse ohne zugesetzten Zucker – gedacht für Kinderhaende, gern genommen von Erwachsenen.',
   30, true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Dokumentation an den Tabellen
-- ---------------------------------------------------------------------------

COMMENT ON TABLE  public.product_lines IS 'Produktlinien (Classic, Athletic, Kids, später mehr). Ersetzt das frühere Textfeld products.category. Rein darstellend – das Verhalten hängt an products.kind.';
COMMENT ON TABLE  public.varieties IS 'Sorten mit Rezept und LMIV-Pflichtangaben. Eine Sorte wird nie direkt verkauft, sondern immer ueber ein Produkt.';
COMMENT ON COLUMN public.varieties.piece_weight_grams IS 'Gewicht eines einzelnen Kekses. Grundlage fuer Nettofüllmenge und Grundpreis der Verkaufseinheit.';
COMMENT ON TABLE  public.product_varieties IS 'Feste Zusammenstellung: welche Sorte steckt wie oft in einem Produkt. Konfigurierbare Produkte haben hier keine Zeilen.';
COMMENT ON COLUMN public.products.kind IS 'fixed = feste Zusammenstellung, configurable = Kundschaft wählt die Sorten selbst.';
COMMENT ON COLUMN public.products.piece_count IS 'Anzahl Kekse in der Verkaufseinheit. Beim Konfigurator die Zahl, die gewählt werden muss.';
COMMENT ON COLUMN public.products.weight_grams IS 'Nur noch die deklarierte Nennfuellmenge fuer Ware nach Gewicht. Bei Stückware wird die Fuellmenge aus den Sorten gerechnet.';
COMMENT ON FUNCTION public.admin_save_product(JSONB) IS 'Speichert Produkt und Zusammensetzung in einer Transaktion, damit die LMIV-Trigger korrekt greifen.';
