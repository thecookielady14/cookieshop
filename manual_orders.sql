-- Telefonbestellungen im Shop erfassen – im Supabase SQL Editor ausführen.
--
-- Bei Online-Bestellungen erzwingt Stripe die E-Mail-Adresse; die Spalte muss
-- dafür nicht zwingend sein. Bei telefonischen Bestellungen liegt oft keine
-- Adresse vor, weil die Rechnung ausgedruckt beigelegt wird.
ALTER TABLE public.orders ALTER COLUMN customer_email DROP NOT NULL;

-- Woher kam die Bestellung? 'online' = Shop/Stripe, 'phone' = telefonisch erfasst.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'online';

-- Rechnungsnummer aus Lexware, um Bestellung und Buchhaltung zuordnen zu können.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_reference TEXT;

-- Freitext für Notizen zum Telefonat (Abholtermin, Sonderwunsch o.ä.).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.orders.source IS 'online = Shop/Stripe, phone = telefonisch im Admin erfasst';
COMMENT ON COLUMN public.orders.invoice_reference IS 'Externe Rechnungsnummer (Lexware) bei Telefonbestellungen';

-- Der Admin bietet "Zugestellt" zur Auswahl an, die Prüfbedingung kannte den
-- Wert aber nicht – das Setzen scheiterte mit einem Constraint-Fehler.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled'));
