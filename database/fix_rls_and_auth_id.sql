-- 1. Add auth_id column to users table if it doesn't exist
-- Removing 'public.' prefix to avoid schema issues if search_path is different
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- 3. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. FIX POLICIES
-- Dropping potential identifying policies that might cause the error (UUID = INT)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON users;
DROP POLICY IF EXISTS "Users can update own profile." ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;
DROP POLICY IF EXISTS "Read Access ALL" ON users;
DROP POLICY IF EXISTS "Update Own Profile" ON users;
DROP POLICY IF EXISTS "Admin Update ALL" ON users;
DROP POLICY IF EXISTS "Admin Delete ALL" ON users;
DROP POLICY IF EXISTS "Insert Profile" ON users;


-- CREATE NEW CORRECT POLICIES

-- Allow everyone to read users
CREATE POLICY "Read Access ALL" ON users
FOR SELECT USING (true);

-- Allow authenticated users to update their own profile linked via auth_id
CREATE POLICY "Update Own Profile" ON users
FOR UPDATE USING (auth.uid() = auth_id);

-- Allow Admin Update (checking role column)
CREATE POLICY "Admin Update ALL" ON users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Allow Admin Delete
CREATE POLICY "Admin Delete ALL" ON users
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Allow Insert
CREATE POLICY "Insert Profile" ON users
FOR INSERT WITH CHECK (true);
