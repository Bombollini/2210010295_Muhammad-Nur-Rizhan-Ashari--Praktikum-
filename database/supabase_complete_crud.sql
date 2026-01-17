-- MASTER SCRIPT: ENABLE FULL CRUD FOR ALL TABLES
-- This script relaxes constraints and enables INSERT/UPDATE/DELETE for all modules.
-- Run this in Supabase SQL Editor.

-- 1. Relax Constraint on profiles.id (Drop FK to auth.users if exists)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;

-- 3. ENABLE FULL CRUD POLICIES (Authenticated Users Only)

-- PROFILES (Teachers/Staff)
CREATE POLICY "Enable All CRUD for Profiles" ON public.profiles 
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- STUDENTS
CREATE POLICY "Enable All CRUD for Students" ON public.students 
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- CLASSES
CREATE POLICY "Enable All CRUD for Classes" ON public.classes 
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- SUBJECTS
CREATE POLICY "Enable All CRUD for Subjects" ON public.subjects 
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- SCHEDULES
CREATE POLICY "Enable All CRUD for Schedules" ON public.schedules 
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ATTENDANCE
CREATE POLICY "Enable All CRUD for Attendance" ON public.attendance 
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- POINTS LOG
CREATE POLICY "Enable All CRUD for Points" ON public.points_log 
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;
