-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RPC Function to create a user (Auth + Public)
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
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to access auth schema
AS $$
DECLARE
    new_user_id UUID;
    encrypted_pw TEXT;
BEGIN
    -- 1. Check if usage is allowed (Simple check: User must be logged in)
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- 2. Check if email already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = create_new_user.email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Email already registered');
    END IF;

    -- 3. Hash Password
    encrypted_pw := crypt(password, gen_salt('bf'));
    new_user_id := gen_random_uuid();

    -- 4. Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
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
        now(),
        now(),
        '',
        ''
    );

    -- 5. Insert into auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id, -- Added this column
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id::text, email)::jsonb,
        'email',
        new_user_id::text, -- Use user_id as provider_id for email provider
        now(),
        now(),
        now()
    );

    -- 6. Insert into public.users
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
        password -- Legacy column requirement
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
        new_user_id,
        encrypted_pw -- Storing hash in legacy column
    );

    RETURN jsonb_build_object('success', true, 'user_id', new_user_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
