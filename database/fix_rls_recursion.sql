-- FINAL RLS FIX (Anti-Recursion)
-- We separate policies to prevent "Read" checking "Admin" which checks "Read" again.

-- 1. Reset Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON users;
DROP POLICY IF EXISTS "Users can update own profile." ON users;
DROP POLICY IF EXISTS "Read Access ALL" ON users;
DROP POLICY IF EXISTS "Update Own Profile" ON users;
DROP POLICY IF EXISTS "Admin Update ALL" ON users;
DROP POLICY IF EXISTS "Admin Delete ALL" ON users;
DROP POLICY IF EXISTS "Admin All" ON users;
DROP POLICY IF EXISTS "Insert Profile" ON users;
DROP POLICY IF EXISTS "Admin Modify" ON users;

-- 2. READ Policy (No checks, just must be logged in)
-- This breaks the recursion because SELECTs don't trigger is_admin()
CREATE POLICY "Read Access ALL" ON public.users
FOR SELECT TO authenticated USING (true);

-- 3. UPDATE/DELETE Policy (Admins Only)
-- This uses is_admin(), but since it's only for UPDATE/DELETE, 
-- and is_admin() uses SELECT (covered by rule #2), it won't loop.
CREATE POLICY "Admin Modify" ON public.users
FOR ALL TO authenticated USING (public.is_admin());

-- Note: "FOR ALL" includes SELECT, so we must be careful.
-- Better approach: Explicitly define modifications.

DROP POLICY IF EXISTS "Admin Modify" ON users;

CREATE POLICY "Admin Update" ON public.users
FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Admin Delete" ON public.users
FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admin Insert" ON public.users
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- 4. Self-Update Policy (Optional, if users can edit own profile)
CREATE POLICY "Self Update" ON public.users
FOR UPDATE TO authenticated USING (auth_id = auth.uid());
