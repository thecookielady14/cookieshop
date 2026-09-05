-- LMIV-Pflichtangaben für Lebensmittel im Fernabsatz – im Supabase SQL Editor ausführen.
--
-- Beim Verkauf von Lebensmitteln über das Internet müssen die Pflichtangaben
-- schon VOR dem Kaufabschluss verfügbar sein (Art. 14 LMIV). Bisher waren
-- Zutaten und Allergene optionale Felder – ein Produkt ohne diese Angaben
-- konnte online gehen.

-- Bezeichnung des Lebensmittels (Verkehrsbezeichnung). Das ist NICHT der
-- Fantasiename: "Double Choc Fudge" ist eine Marke, die Bezeichnung wäre
-- z.B. "Feingebäck mit Schokoladenstückchen".
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS legal_name TEXT;

-- Nährwertdeklaration je 100 g. Optional, weil für handwerklich hergestellte
-- Lebensmittel in kleinen Mengen eine Ausnahme greifen kann (Anhang V Nr. 19
-- LMIV). Sobald ein Wert gesetzt ist, wird die Tabelle auf der Produktseite
-- angezeigt.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS energy_kj NUMERIC(8,1);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS energy_kcal NUMERIC(8,1);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fat_g NUMERIC(6,1);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS saturated_fat_g NUMERIC(6,1);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS carbs_g NUMERIC(6,1);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sugar_g NUMERIC(6,1);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS protein_g NUMERIC(6,1);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS salt_g NUMERIC(6,2);

-- Kern der Sache: ein Produkt darf nur dann im Shop bestellbar sein, wenn die
-- Pflichtangaben vollständig sind. Unvollständige Produkte lassen sich weiter
-- als Entwurf speichern (is_available = false), nur eben nicht veröffentlichen.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_lmiv_complete;
ALTER TABLE public.products ADD CONSTRAINT products_lmiv_complete CHECK (
  is_available IS NOT TRUE
  OR (
    legal_name IS NOT NULL AND btrim(legal_name) <> ''
    AND ingredients IS NOT NULL AND btrim(ingredients) <> ''
    AND allergens IS NOT NULL AND btrim(allergens) <> ''
    AND weight_grams IS NOT NULL AND weight_grams > 0
  )
);

COMMENT ON COLUMN public.products.legal_name IS
  'Bezeichnung des Lebensmittels nach LMIV (Verkehrsbezeichnung), nicht der Marken- oder Fantasiename.';
COMMENT ON CONSTRAINT products_lmiv_complete ON public.products IS
  'Nur vollständig gekennzeichnete Produkte dürfen bestellbar sein (Art. 14 LMIV).';
