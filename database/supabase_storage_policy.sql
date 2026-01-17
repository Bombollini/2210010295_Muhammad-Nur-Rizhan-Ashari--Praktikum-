-- STORAGE POLICIES (CORRECTED)
-- Create specific bucket for avatars if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- DROP EXISTING POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;

-- Allow Authenticated Users to Upload (INSERT)
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  bucket_id = 'avatars'
);

-- Allow Public to View (SELECT)
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow Authenticated Users to Update
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE
USING ( auth.role() = 'authenticated' AND bucket_id = 'avatars' );

-- Allow Authenticated Users to Delete
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE
USING ( auth.role() = 'authenticated' AND bucket_id = 'avatars' );
