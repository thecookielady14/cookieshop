-- Atomarer Lagerabzug – im Supabase SQL Editor ausführen.
--
-- Vorher hat der Webhook den Bestand gelesen, im Code gerechnet und
-- zurückgeschrieben. Zwei gleichzeitige Bestellungen lesen dabei denselben
-- Ausgangswert und der Bestand sinkt nur um eine Bestellung statt um zwei.
-- Diese Funktion rechnet direkt in der Datenbank und ist damit rennsicher.

CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_stock INTEGER;
BEGIN
  UPDATE public.products
  SET
    stock_count = GREATEST(0, COALESCE(stock_count, 0) - p_quantity),
    -- Bei 0 automatisch aus dem Verkauf nehmen
    is_available = CASE
      WHEN GREATEST(0, COALESCE(stock_count, 0) - p_quantity) = 0 THEN false
      ELSE is_available
    END,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_product_id
  RETURNING stock_count INTO v_new_stock;

  RETURN v_new_stock;
END;
$$;

-- Nur der Server (Service Role) ruft die Funktion auf, nicht der Browser.
REVOKE ALL ON FUNCTION public.decrement_stock(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_stock(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_stock(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) TO service_role;
