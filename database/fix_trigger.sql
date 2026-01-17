-- FIX TRIGGER FUNCTION to avoid jsonb - jsonb error
CREATE OR REPLACE FUNCTION public.log_data_change()
RETURNS TRIGGER AS $$
DECLARE
    current_app_user_id INT;
    record_identifier TEXT;
    log_activity_text TEXT;
    log_details TEXT;
BEGIN
    -- Attempt to identify app user
    BEGIN
        SELECT id INTO current_app_user_id
        FROM public.users
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        current_app_user_id := NULL;
    END;

    -- Determine Identifier
    IF (TG_TABLE_NAME = 'users') THEN
        record_identifier := COALESCE(NEW.nama_lengkap, OLD.nama_lengkap);
    ELSIF (TG_TABLE_NAME = 'siswa') THEN
        record_identifier := COALESCE(NEW.nama_lengkap, OLD.nama_lengkap);
    ELSIF (TG_TABLE_NAME = 'kelas') THEN
        record_identifier := COALESCE(NEW.nama_kelas, OLD.nama_kelas);
    ELSIF (TG_TABLE_NAME = 'mata_pelajaran') THEN
        record_identifier := COALESCE(NEW.nama_mapel, OLD.nama_mapel);
    ELSE
        record_identifier := 'ID: ' || COALESCE(NEW.id, OLD.id)::TEXT;
    END IF;

    log_activity_text := TG_OP || ' on ' || TG_TABLE_NAME || ': ' || record_identifier;
    
    -- Format Details (Safe Version without subtraction)
    IF (TG_OP = 'INSERT') THEN
        log_details := row_to_json(NEW)::TEXT;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Simply log both OLD and NEW to avoid operator error
        log_details := 'OLD: ' || row_to_json(OLD)::TEXT || ' | NEW: ' || row_to_json(NEW)::TEXT;
    ELSIF (TG_OP = 'DELETE') THEN
        log_details := row_to_json(OLD)::TEXT;
    END IF;

    -- Insert Log
    INSERT INTO public.activity_logs (
        user_id, 
        activity, 
        module, 
        action, 
        details
    ) VALUES (
        current_app_user_id,
        log_activity_text,
        TG_TABLE_NAME,
        TG_OP,
        log_details
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
