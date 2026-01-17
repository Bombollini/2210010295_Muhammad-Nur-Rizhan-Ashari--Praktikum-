-- CHECK INSTANCE ID
-- We need to know the correct 'instance_id' for your project.
-- Run this after you successfully Sign Up a user manually.

SELECT DISTINCT instance_id 
FROM auth.users;

-- If this returns a UUID other than 00000000-0000-0000-0000-000000000000,
-- then we must update our create_user_rpc.sql to use that UUID.
