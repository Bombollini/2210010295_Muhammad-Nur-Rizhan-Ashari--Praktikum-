-- CLONE WORKING USER STRATEGY
-- Instead of guessing columns, we COPY a known working user.

BEGIN;

-- 1. Variables
DO $$
DECLARE
    source_email TEXT := 'abdul@guru.com'; -- The user we know works
    target_email TEXT := 'admin@tes.com';
    target_password TEXT := '123456';
    new_user_id UUID := gen_random_uuid();
    source_user_id UUID;
BEGIN
    -- Get Source ID
    SELECT id INTO source_user_id FROM auth.users WHERE email = source_email;
    
    IF source_user_id IS NULL THEN
        RAISE EXCEPTION 'Source user % not found', source_email;
    END IF;

    -- Cleanup Target if exists
    DELETE FROM public.users WHERE email = target_email;
    DELETE FROM auth.users WHERE email = target_email;

    -- 2. Clone auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, 
        recovery_token, recovery_sent_at, email_change_token_new, email_change, 
        email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
        is_super_admin, created_at, updated_at, phone, phone_confirmed_at, 
        phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, 
        email_change_confirm_status, banned_until, reauthentication_token, is_sso_user, 
        deleted_at
    )
    SELECT 
        instance_id, new_user_id, aud, role, target_email, crypt(target_password, gen_salt('bf', 10)), 
        now(), invited_at, confirmation_token, confirmation_sent_at, 
        recovery_token, recovery_sent_at, email_change_token_new, email_change, 
        email_change_sent_at, NULL, raw_app_meta_data, 
        jsonb_build_object('full_name', 'Admin Clone', 'role', 'admin'), -- Update Meta
        is_super_admin, now(), now(), phone, phone_confirmed_at, 
        phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, 
        email_change_confirm_status, banned_until, reauthentication_token, is_sso_user, 
        deleted_at
    FROM auth.users
    WHERE id = source_user_id;

    -- 3. Clone auth.identities
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at, email
    )
    VALUES (
        gen_random_uuid(), -- Identity ID is unique
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id::text, target_email)::jsonb,
        'email',
        new_user_id::text, -- Provider ID for email is user_id
        NULL,
        now(),
        now(),
        target_email -- identity_data -> email often duplicated here in newer schemas
    );
    -- Note: older schemas might not have 'email' column in identities, if this fails we remove it.
    -- But checking screenshot, it seems identities has (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    -- Column 'email' only exists in recent Supabase versions. If error, I'll remove it.

    -- 4. Insert public.users
    INSERT INTO public.users (
        auth_id, email, username, nama_lengkap, role, status, password
    ) VALUES (
        new_user_id, target_email, 'admin_clone', 'Admin Clone', 'admin', 'aktif', 
        crypt(target_password, gen_salt('bf', 10))
    );

    RAISE NOTICE 'User Cloned Successfully: % (ID: %)', target_email, new_user_id;
END $$;

COMMIT;
