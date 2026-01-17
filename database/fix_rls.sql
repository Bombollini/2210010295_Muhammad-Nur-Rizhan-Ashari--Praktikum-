-- FIX RLS POLICIES
-- Ensures all tables have policies allowing access for authenticated users (and anon for dev if needed)

BEGIN;

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poin_pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poin_prestasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow All" ON public.users;
DROP POLICY IF EXISTS "Allow All" ON public.kelas;
DROP POLICY IF EXISTS "Allow All" ON public.mata_pelajaran;
DROP POLICY IF EXISTS "Allow All" ON public.jadwal_kelas;
DROP POLICY IF EXISTS "Allow All" ON public.siswa;

DROP POLICY IF EXISTS "Allow All Access" ON public.users;
DROP POLICY IF EXISTS "Allow All Access" ON public.kelas;
DROP POLICY IF EXISTS "Allow All Access" ON public.mata_pelajaran;
DROP POLICY IF EXISTS "Allow All Access" ON public.jadwal_kelas;
DROP POLICY IF EXISTS "Allow All Access" ON public.siswa;

-- 3. Re-create permissive policies for development
-- Using "FOR ALL" to cover SELECT, INSERT, UPDATE, DELETE

CREATE POLICY "Enable All Access for Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access for Kelas" ON public.kelas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access for Mapel" ON public.mata_pelajaran FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access for Jadwal" ON public.jadwal_kelas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access for Siswa" ON public.siswa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access for Poin" ON public.poin_pelanggaran FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access for Absensi" ON public.absensi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access for TahunAjaran" ON public.tahun_ajaran FOR ALL USING (true) WITH CHECK (true);


COMMIT;
