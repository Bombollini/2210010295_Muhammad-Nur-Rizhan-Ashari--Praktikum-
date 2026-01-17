-- Add missing 'kkm' column to mata_pelajaran
BEGIN;

ALTER TABLE public.mata_pelajaran 
ADD COLUMN IF NOT EXISTS kkm INT DEFAULT 75;

-- Refresh schema cache (implicit in Supabase usually, but good to know)
NOTIFY pgrst, 'reload schema';

COMMIT;
