-- DATA SEEDING SCRIPT (CORRECTED)
-- Populates the database with realistic dummy data.
-- Auto-fixes missing columns/tables where possible for safety.

BEGIN;

-- 0. Ensure KKM column exists (Idempotent fix)
DO $$
BEGIN
    ALTER TABLE public.mata_pelajaran ADD COLUMN IF NOT EXISTS kkm INT DEFAULT 75;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 1. Seed Academic Years (Tahun Ajaran)
-- Table: id, tahun_ajaran (unique), tanggal_mulai, ...
INSERT INTO public.tahun_ajaran (tahun_ajaran, tanggal_mulai, tanggal_selesai, status)
VALUES 
    ('2024/2025', '2024-07-15', '2025-06-20', 'aktif'),
    ('2025/2026', '2025-07-14', '2026-06-19', 'akan_datang')
ON CONFLICT (tahun_ajaran) DO UPDATE 
SET status = EXCLUDED.status;

-- 2. Seed Semesters
-- Table: id, tahun_ajaran (varchar), semester (enum), ...
INSERT INTO public.semester (tahun_ajaran, semester, tanggal_mulai, tanggal_selesai, status)
VALUES 
    ('2024/2025', 'ganjil', '2024-07-15', '2024-12-15', 'selesai'),
    ('2024/2025', 'genap', '2025-01-06', '2025-06-20', 'aktif')
ON CONFLICT (tahun_ajaran, semester) DO NOTHING;

-- 3. Seed Users (Guru) if not exists
-- We need at least one teacher for the Schedule
INSERT INTO public.users (email, role, nama_lengkap, username, password, status)
VALUES 
    -- Only inserts if email doesn't exist (handled by ON CONFLICT if constraint exists, else we use DO NOTHING or check first)
    ('guru_mtk@sekolah.id', 'guru', 'Budi Matematika', 'guru_mtk', '$2a$10$abcdefg...', 'aktif'),
    ('guru_indo@sekolah.id', 'guru', 'Siti Bahasa', 'guru_indo', '$2a$10$abcdefg...', 'aktif')
ON CONFLICT (email) DO NOTHING;

-- 4. Seed Classes (Kelas)
-- Added 'kode_kelas' which is required unique
INSERT INTO public.kelas (kode_kelas, nama_kelas, tingkat, jurusan, tahun_ajaran, semester)
VALUES
    ('X-IPA-1', 'X IPA 1', 'X', 'IPA', '2024/2025', 'genap'),
    ('X-IPA-2', 'X IPA 2', 'X', 'IPA', '2024/2025', 'genap'),
    ('X-IPS-1', 'X IPS 1', 'X', 'IPS', '2024/2025', 'genap'),
    ('XI-IPA-1', 'XI IPA 1', 'XI', 'IPA', '2024/2025', 'genap'),
    ('XII-IPA-1', 'XII IPA 1', 'XII', 'IPA', '2024/2025', 'genap')
ON CONFLICT (kode_kelas) DO NOTHING;

-- 5. Seed Subjects (Mata Pelajaran)
-- Added 'kkm' explicitly
INSERT INTO public.mata_pelajaran (nama_mapel, kode_mapel, kkm, deskripsi, kategori, tingkat)
VALUES
    ('Matematika Wajib', 'MTK-W', 75, 'Matematika dasar', 'umum', 'semua'),
    ('Bahasa Indonesia', 'BIND', 75, 'Bahasa Nasional', 'umum', 'semua'),
    ('Bahasa Inggris', 'BING', 75, 'English Language', 'umum', 'semua'),
    ('Fisika', 'FIS', 78, 'Fisika Dasar', 'peminatan', 'semua'),
    ('Kimia', 'KIM', 78, 'Kimia Dasar', 'peminatan', 'semua')
ON CONFLICT (kode_mapel) DO NOTHING;

-- 6. Seed Students (Siswa)
DO $$
DECLARE
    cls_x_ipa_1 INT;
BEGIN
    SELECT id INTO cls_x_ipa_1 FROM public.kelas WHERE kode_kelas = 'X-IPA-1' LIMIT 1;

    INSERT INTO public.siswa (nis, nisn, nama_lengkap, kelas_id, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, nama_ayah, nama_ibu, no_telepon_ortu, status)
    VALUES
        ('2024001', '0012345678', 'Ahmad Rizki', cls_x_ipa_1, 'L', 'Jakarta', '2008-05-12', 'Jl. Merpati', 'Budi', 'Siti', '08123', 'aktif'),
        ('2024002', '0012345679', 'Bunga Citra', cls_x_ipa_1, 'P', 'Bandung', '2008-08-23', 'Jl. Mawar', 'Dedi', 'Rina', '08124', 'aktif')
    ON CONFLICT (nis) DO NOTHING;
END $$;

-- 7. Seed Schedule (Jadwal)
DO $$
DECLARE
    cls_x_ipa_1 INT;
    subj_mtk INT;
    subj_bind INT;
    teacher_id INT;
BEGIN
    SELECT id INTO cls_x_ipa_1 FROM public.kelas WHERE kode_kelas = 'X-IPA-1' LIMIT 1;
    SELECT id INTO subj_mtk FROM public.mata_pelajaran WHERE kode_mapel = 'MTK-W' LIMIT 1;
    SELECT id INTO subj_bind FROM public.mata_pelajaran WHERE kode_mapel = 'BIND' LIMIT 1;
    
    -- Pick any valid user as teacher (fallback to first found if specific emails failed)
    SELECT id INTO teacher_id FROM public.users WHERE role IN ('guru', 'admin') LIMIT 1;

    IF teacher_id IS NOT NULL THEN
        INSERT INTO public.jadwal_kelas (kelas_id, mapel_id, guru_id, hari, sesi, ruangan, tahun_ajaran, semester)
        VALUES
            (cls_x_ipa_1, subj_bind, teacher_id, 'Senin', 1, 'R.101', '2024/2025', 'genap'),
            (cls_x_ipa_1, subj_mtk, teacher_id, 'Senin', 2, 'R.101', '2024/2025', 'genap')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

COMMIT;
