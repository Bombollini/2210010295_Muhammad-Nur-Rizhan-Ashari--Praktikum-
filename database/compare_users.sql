-- COMPARE USERS
-- Run this to compare the data of the working user (Signup) vs the broken user (RPC)

SELECT 
    email, 
    encrypted_password, 
    raw_user_meta_data, 
    raw_app_meta_data,
    created_at
FROM auth.users;

SELECT 
    u.email,
    i.provider,
    i.provider_id,
    i.identity_data
FROM auth.identities i
JOIN auth.users u ON i.user_id = u.id;
