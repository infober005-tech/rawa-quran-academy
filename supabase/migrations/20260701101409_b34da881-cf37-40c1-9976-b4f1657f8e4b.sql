
ALTER TABLE public.halaqas
  ADD COLUMN IF NOT EXISTS halaqa_date date,
  ADD COLUMN IF NOT EXISTS halaqa_day smallint CHECK (halaqa_day IS NULL OR (halaqa_day BETWEEN 0 AND 6));
