-- MASTER FIX SCRIPT for User Creation
-- Run this ENTIRE script in Supabase SQL Editor to fix all issues.

-- 1. CLEANUP: Remove faulty triggers causing "public.profiles" errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_profile_for_user();

-- 2. SETUP: Ensure pgcrypto is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. FUNCTION: Create the robust User Provisioning RPC
-- Drops old version first to ensure signature updates work
DROP FUNCTION IF EXISTS public.create_new_user(text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_new_user(
    email TEXT,
    password TEXT,
    nama_lengkap TEXT,
    role TEXT,
    username TEXT,
    nip TEXT DEFAULT NULL,
    jenis_kelamin TEXT DEFAULT 'L',
    tempat_lahir TEXT DEFAULT NULL,
    tanggal_lahir DATE DEFAULT NULL,
    alamat TEXT DEFAULT NULL,
    no_telepon TEXT DEFAULT NULL,
    jabatan TEXT DEFAULT NULL,
    bidang_studi TEXT DEFAULT NULL,
    foto TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    encrypted_pw TEXT;
BEGIN
    -- Check permissions (optional, currently open for simplicity/demo)
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Check if email exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = create_new_user.email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Email already registered');
    END IF;

    -- Generate Data
    -- FIX: Force Cost Factor 10 ($2a$10$) to match Supabase Auth standard
    encrypted_pw := crypt(password, gen_salt('bf', 10));
    new_user_id := gen_random_uuid();

    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        email,
        encrypted_pw,
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('full_name', nama_lengkap, 'role', role),
        now(),
        now(),
        '',
        ''
    );

    -- Insert into auth.identities (FIXED: Added provider_id)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id::text, email)::jsonb,
        'email',
        new_user_id::text, -- Use user_id as provider_id
        now(),
        now(),
        now()
    );

    -- Insert into public.users (FIXED: auth_id type and password column)
    INSERT INTO public.users (
        nama_lengkap,
        email,
        username,
        role,
        nip,
        jenis_kelamin,
        tempat_lahir,
        tanggal_lahir,
        alamat,
        no_telepon,
        jabatan,
        bidang_studi,
        foto,
        status,
        auth_id,
        password -- Legacy column
    ) VALUES (
        nama_lengkap,
        email,
        username,
        role::user_role_enum,
        nip,
        jenis_kelamin::jenis_kelamin_enum,
        tempat_lahir,
        tanggal_lahir,
        alamat,
        no_telepon,
        jabatan,
        bidang_studi,
        foto,
        'aktif',
        new_user_id, -- Passed as UUID (no cast)
        encrypted_pw -- Passed to legacy password column
    );

    RETURN jsonb_build_object('success', true, 'user_id', new_user_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
