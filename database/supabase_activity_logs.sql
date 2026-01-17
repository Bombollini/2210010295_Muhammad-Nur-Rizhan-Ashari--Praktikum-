-- ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Optional: link to auth.users if triggered by specific user context (hard in triggers without helpers)
    action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id UUID, -- ID of the record changed
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated to read/insert logs
CREATE POLICY "Authenticated users can view logs" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS FOR AUTO-LOGGING

CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    detail TEXT;
    rec_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        detail := 'Data baru ditambahkan di ' || TG_TABLE_NAME;
        rec_id := NEW.id;
    ELSIF (TG_OP = 'UPDATE') THEN
        detail := 'Data diperbarui di ' || TG_TABLE_NAME;
        rec_id := NEW.id;
    ELSIF (TG_OP = 'DELETE') THEN
        detail := 'Data dihapus dari ' || TG_TABLE_NAME;
        rec_id := OLD.id;
    END IF;

    INSERT INTO public.activity_logs (action_type, table_name, record_id, description)
    VALUES (TG_OP, TG_TABLE_NAME, rec_id, detail);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to key tables
DROP TRIGGER IF EXISTS trigger_log_students ON public.students;
CREATE TRIGGER trigger_log_students AFTER INSERT OR UPDATE OR DELETE ON public.students FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS trigger_log_classes ON public.classes;
CREATE TRIGGER trigger_log_classes AFTER INSERT OR UPDATE OR DELETE ON public.classes FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS trigger_log_points ON public.points_log;
CREATE TRIGGER trigger_log_points AFTER INSERT OR UPDATE OR DELETE ON public.points_log FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS trigger_log_attendance ON public.attendance;
CREATE TRIGGER trigger_log_attendance AFTER INSERT OR UPDATE OR DELETE ON public.attendance FOR EACH ROW EXECUTE FUNCTION log_activity();
