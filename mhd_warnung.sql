-- MHD-Warnung für Zutaten – im Supabase SQL Editor ausführen.
-- Setzt rueckverfolgung.sql voraus.
--
-- Gewarnt wird pro Zutat freiwillig: mhd_warn_days = NULL heißt „nie warnen"
-- (z. B. Salz oder Zucker, deren MHD praktisch keine Rolle spielt). Eine Zahl
-- heißt „so viele Tage vor dem MHD warnen".
--
-- Nur Chargen, die noch nicht als aufgebraucht markiert sind, lösen eine
-- Warnung aus – eine leere Packung muss niemanden mehr beunruhigen.

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS mhd_warn_days INTEGER
  CHECK (mhd_warn_days IS NULL OR mhd_warn_days BETWEEN 0 AND 365);

-- Wann die E-Mail rausging. Zwei Stufen, jeweils genau einmal:
-- „läuft bald ab" und „ist abgelaufen".
ALTER TABLE public.ingredient_lots ADD COLUMN IF NOT EXISTS mhd_warned_at  TIMESTAMPTZ;
ALTER TABLE public.ingredient_lots ADD COLUMN IF NOT EXISTS mhd_expired_at TIMESTAMPTZ;

-- Die Regel steht genau einmal hier; Adminbereich und E-Mail lesen beide
-- diese Sicht. security_invoker: es gelten die RLS-Regeln des Aufrufers,
-- die Sicht öffnet also nichts, was die Tabellen nicht ohnehin erlauben.
CREATE OR REPLACE VIEW public.mhd_warnings
WITH (security_invoker = true) AS
SELECT
  l.id              AS lot_id,
  l.lot_number,
  l.best_before,
  l.best_before - CURRENT_DATE AS days_left,
  l.mhd_warned_at,
  l.mhd_expired_at,
  i.id              AS ingredient_id,
  i.name            AS ingredient_name,
  i.supplier,
  i.mhd_warn_days
FROM public.ingredient_lots l
JOIN public.ingredients i ON i.id = l.ingredient_id
WHERE l.is_used_up = false
  AND l.best_before IS NOT NULL
  AND i.mhd_warn_days IS NOT NULL
  AND l.best_before - CURRENT_DATE <= i.mhd_warn_days;

COMMENT ON COLUMN public.ingredients.mhd_warn_days IS 'NULL = keine MHD-Warnung. Sonst: so viele Tage vor dem MHD warnen.';
COMMENT ON VIEW public.mhd_warnings IS 'Offene Zutatenchargen, deren MHD im Warnzeitraum liegt oder überschritten ist. Grundlage für Adminhinweis und E-Mail.';
