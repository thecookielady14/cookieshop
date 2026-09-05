-- Shop-Einstellungen (Versandkosten etc.) – im Supabase SQL Editor ausführen.
-- Einzeiliger Konfigurations-Datensatz: id ist immer 1.

CREATE TABLE IF NOT EXISTS public.shop_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 4.90,
  -- NULL bedeutet: kein kostenloser Versand, egal wie hoch der Warenkorb ist
  free_shipping_threshold DECIMAL(10, 2) DEFAULT 30.00,
  delivery_days_min INTEGER NOT NULL DEFAULT 2,
  delivery_days_max INTEGER NOT NULL DEFAULT 4,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Startwerte anlegen (entspricht den bisher hartcodierten Werten)
INSERT INTO public.shop_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- Versandkosten muss jeder lesen können (Warenkorb, Produktseite, /versand)
DROP POLICY IF EXISTS "Shop settings are viewable by everyone" ON public.shop_settings;
CREATE POLICY "Shop settings are viewable by everyone"
ON public.shop_settings FOR SELECT USING (true);

-- Ändern darf nur der eingeloggte Admin
DROP POLICY IF EXISTS "Admins can update shop settings" ON public.shop_settings;
CREATE POLICY "Admins can update shop settings"
ON public.shop_settings FOR UPDATE USING (auth.role() = 'authenticated');
