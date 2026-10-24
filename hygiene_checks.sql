-- HACCP-Eigenkontrollen (Hygiene-Checklisten) – im Supabase SQL Editor ausführen.
--
-- Ersetzt die Papierformulare des HACCP-Plans an Backtagen:
--   Formular 2 (Kühlschrank), 3 Teil B (Reinigung), 4 Teil A (Schädlinge),
--   5 (Produktion/Backen) und 7 (Etikettenkontrolle) → eine Backtag-Checkliste
--   Formular 3/4 Teil B (Monatskontrolle) → eine Monats-Checkliste
--
-- Damit die Dokumentation bei einer Kontrolle zählt, darf sie nachträglich
-- nicht still geändert werden: Einträge lassen sich nur ANLEGEN, nicht
-- bearbeiten oder löschen. Ein Fehler wird mit einem neuen Eintrag
-- (Nachtrag) korrigiert. created_at zeigt, wann wirklich eingetragen wurde.

CREATE TABLE IF NOT EXISTS public.hygiene_checks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         TEXT NOT NULL CHECK (kind IN ('backtag', 'monat')),
  check_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Kühlschranktemperatur in °C (nur Backtag)
  fridge_temp  NUMERIC(4,1),
  -- Backtemperatur/-zeit und Gewichts-Stichprobe als Freitext, weil sie je Sorte abweichen
  bake_info    TEXT,
  -- Abgehakte Punkte: {"flaechen_vor": true, ...}. Nicht abgehakt = Abweichung.
  items        JSONB NOT NULL DEFAULT '{}'::jsonb,
  deviation    TEXT,
  signed_by    TEXT NOT NULL CHECK (btrim(signed_by) <> ''),
  -- Nachtrag zu einem früheren Eintrag (Korrektur)
  corrects_id  UUID REFERENCES public.hygiene_checks(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS hygiene_checks_date_idx ON public.hygiene_checks (check_date DESC);

ALTER TABLE public.hygiene_checks ENABLE ROW LEVEL SECURITY;

-- Nur lesen und anlegen – bewusst keine UPDATE- oder DELETE-Regel.
DROP POLICY IF EXISTS "Admins read hygiene checks" ON public.hygiene_checks;
CREATE POLICY "Admins read hygiene checks" ON public.hygiene_checks FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins add hygiene checks" ON public.hygiene_checks;
CREATE POLICY "Admins add hygiene checks" ON public.hygiene_checks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
