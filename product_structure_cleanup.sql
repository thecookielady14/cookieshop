-- Sortiment umstrukturieren, Teil 2 von 2 – im Supabase SQL Editor ausführen.
--
-- Entfernt die Spalten aus products, die inzwischen bei den Sorten liegen.
-- Bewusst erst jetzt: solange der Code noch umgestellt wurde, blieben sie
-- stehen, damit zwischendurch nichts bricht.
--
-- Was bleibt und warum:
--   legal_name     – die Packung braucht eine eigene Bezeichnung
--                    ("Feingebäck, gemischt"), die Sorten haben zusätzlich ihre
--   consumer_info  – Lagerhinweise können an der Packung hängen
--   weight_grams   – nur noch die deklarierte Nennfüllmenge für Ware nach
--                    Gewicht; bei Stückware wird aus den Sorten gerechnet

ALTER TABLE public.products DROP COLUMN IF EXISTS ingredients;
ALTER TABLE public.products DROP COLUMN IF EXISTS allergens;
ALTER TABLE public.products DROP COLUMN IF EXISTS energy_kj;
ALTER TABLE public.products DROP COLUMN IF EXISTS energy_kcal;
ALTER TABLE public.products DROP COLUMN IF EXISTS fat_g;
ALTER TABLE public.products DROP COLUMN IF EXISTS saturated_fat_g;
ALTER TABLE public.products DROP COLUMN IF EXISTS carbs_g;
ALTER TABLE public.products DROP COLUMN IF EXISTS sugar_g;
ALTER TABLE public.products DROP COLUMN IF EXISTS protein_g;
ALTER TABLE public.products DROP COLUMN IF EXISTS salt_g;

-- Das freie Textfeld mit den zwei fest im Code stehenden Werten
-- ('classic'/'kids') ist durch product_lines ersetzt.
ALTER TABLE public.products DROP COLUMN IF EXISTS category;

-- line_id ist ab jetzt Pflicht: ein Verkaufsartikel ohne Linie waere weder
-- im Shop auffindbar noch pruefbar.
UPDATE public.products SET line_id = (SELECT id FROM public.product_lines ORDER BY sort_order LIMIT 1)
 WHERE line_id IS NULL;
ALTER TABLE public.products ALTER COLUMN line_id SET NOT NULL;
