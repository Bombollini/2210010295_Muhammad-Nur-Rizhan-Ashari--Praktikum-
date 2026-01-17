-- RESTORE SIGNUP TRIGGER
-- Needed because we deleted all triggers to debug login.
-- Now "Sign Up" works for Auth but doesn't create a Public User, causing the "Default to Admin" bug.

-- 1. Create Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search path
AS $$
DECLARE
    assigned_role user_role_enum;
BEGIN
    -- Determine Role from Metadata
    BEGIN
        assigned_role := (new.raw_user_meta_data->>'role')::user_role_enum;
        
        -- Double check if casting resulted in null (though casting usually throws)
        IF assigned_role IS NULL THEN
            RAISE EXCEPTION 'Role cannot be null';
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- STOP SILENT FALLBACK! Raise error so we know what's wrong.
        RAISE EXCEPTION 'Invalid Role Value: %. Error: %', new.raw_user_meta_data->>'role', SQLERRM;
    END;

    -- Insert into public.users
    INSERT INTO public.users (
        auth_id,
        email,
        nama_lengkap,
        role,
        status,
        username,
        password -- FIX: Required by table schema
    ) VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        assigned_role,
        'aktif',
        SPLIT_PART(new.email, '@', 1), -- Simple username
        new.encrypted_password -- Copy hash from Auth
    );

    RETURN new;
END;
$$;

-- 2. Bind Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
