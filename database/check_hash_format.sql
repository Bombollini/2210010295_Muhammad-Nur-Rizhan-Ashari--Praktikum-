-- CHECK HASH FORMAT
-- We need to see the encrypted_password of the WORKING user (Signup)
-- to match our script's hashing algorithm to it.

SELECT 
    email, 
    left(encrypted_password, 15) as hash_prefix, -- Show start of hash (e.g., $2a$10$ or $argon2...)
    raw_app_meta_data
FROM auth.users
WHERE email NOT LIKE 'admin@tes.com'; -- Exclude the broken one
