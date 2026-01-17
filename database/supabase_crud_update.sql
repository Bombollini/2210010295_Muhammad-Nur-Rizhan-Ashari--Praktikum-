-- CRITICAL UPDATE: Relax Profiles Constraints & Enable Full CRUD
-- Use this to allow Adding Teachers via UI without creating Auth Users first.

-- 1. Relax Constraint on profiles.id (Drop FK to auth.users)
-- This allows us to insert "Data Teachers" that don't have login accounts yet.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Make sure ID has a default generator if not exist (it was just uuid before)
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. RLS for Profiles (Allow All Authenticated to CRUD Profiles)
-- Note: In production you'd restrict this to 'admin', but for this request "crud for all data", we enable it.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert profiles" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update profiles" ON public.profiles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete profiles" ON public.profiles FOR DELETE USING (auth.role() = 'authenticated');

-- 4. RLS for Attendance (Full CRUD)
CREATE POLICY "Authenticated users can view attendance" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete attendance" ON public.attendance FOR DELETE USING (auth.role() = 'authenticated');

-- 5. RLS for Points Log (Full CRUD - just in case)
CREATE POLICY "Authenticated users can view points_log" ON public.points_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert points_log" ON public.points_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update points_log" ON public.points_log FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete points_log" ON public.points_log FOR DELETE USING (auth.role() = 'authenticated');
