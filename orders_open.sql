-- Bestellannahme-Schalter – im Supabase SQL Editor ausführen.
--
-- Es gibt keinen Lagerbestand (auf Bestellung gebacken), also fehlt jede
-- Bremse gegen Bestellungen, die die Backkapazität einer Woche sprengen.
-- Dieser Schalter schließt die Bestellannahme für den ganzen Shop.

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS orders_open BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS orders_closed_message TEXT;

COMMENT ON COLUMN public.shop_settings.orders_open IS
  'false = Shop nimmt keine Bestellungen an. Telefonbestellungen im Admin bleiben möglich.';
COMMENT ON COLUMN public.shop_settings.orders_closed_message IS
  'Optionaler eigener Hinweistext, der Kundinnen und Kunden bei geschlossener Bestellannahme angezeigt wird.';
