-- Lagerbestand entfernen – im Supabase SQL Editor ausführen.
--
-- Es wird auf Bestellung gebacken, es gibt also nichts zu lagern. Der Bestand
-- war nur eine Zahl, die gepflegt werden musste und trotzdem nie stimmte.
-- Ob ein Keks bestellbar ist, steuert weiterhin `is_available` im Admin.

DROP FUNCTION IF EXISTS public.decrement_stock(UUID, INTEGER);

ALTER TABLE public.products DROP COLUMN IF EXISTS stock_count;

COMMENT ON COLUMN public.products.is_available IS
  'Manueller Schalter im Admin: true = im Shop bestellbar. Es gibt keinen Lagerbestand, es wird auf Bestellung gebacken.';
