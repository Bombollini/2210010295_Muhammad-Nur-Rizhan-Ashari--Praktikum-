-- FIX LOGIN ERRORS (RLS Recursion + Bad Triggers)

-- 1. Cleanup Triggers that might run on Login (UPDATE triggers)
-- "last_sign_in_at" update triggers these, causing errors if they reference missing tables
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;

-- 2. Create Helper Function to prevent RLS Recursion
-- Checking "Are you Admin?" directly in RLS causes infinite loops. 
-- Wrapping it in SECURITY DEFINER function bypasses RLS for the check.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role::text = 'admin'
  );
END;
$$;

-- 3. Reset and Apply Correct Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove old potentially recursive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON users;
DROP POLICY IF EXISTS "Users can update own profile." ON users;
DROP POLICY IF EXISTS "Read Access ALL" ON users;
DROP POLICY IF EXISTS "Update Own Profile" ON users;
DROP POLICY IF EXISTS "Admin Update ALL" ON users;
DROP POLICY IF EXISTS "Admin Delete ALL" ON users;
DROP POLICY IF EXISTS "Admin All" ON users;
DROP POLICY IF EXISTS "Insert Profile" ON users;

-- Policy: Everyone (Authenticated) can READ
CREATE POLICY "Read Access ALL" ON public.users
FOR SELECT TO authenticated USING (true);

-- Policy: Users can UPDATE themselves
CREATE POLICY "Update Own Profile" ON public.users
FOR UPDATE TO authenticated USING (auth_id = auth.uid());

-- Policy: Admins can do ANYTHING (using non-recursive function)
CREATE POLICY "Admin All" ON public.users
FOR ALL TO authenticated USING (public.is_admin());

-- Policy: Allow Insert (needed for creating users via RPC/API sometimes)
CREATE POLICY "Insert Profile" ON public.users
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
