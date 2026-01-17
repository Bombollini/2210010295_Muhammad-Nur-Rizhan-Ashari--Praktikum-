-- ACTIVITY LOGS UPDATE
-- Add auto-logging triggers for Teachers (Profiles), Subjects, and Schedules

-- 1. Trigger for Teachers/Profiles
DROP TRIGGER IF EXISTS trigger_log_profiles ON public.profiles;
CREATE TRIGGER trigger_log_profiles 
AFTER INSERT OR UPDATE OR DELETE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION log_activity();

-- 2. Trigger for Subjects (Mata Pelajaran)
DROP TRIGGER IF EXISTS trigger_log_subjects ON public.subjects;
CREATE TRIGGER trigger_log_subjects 
AFTER INSERT OR UPDATE OR DELETE ON public.subjects 
FOR EACH ROW EXECUTE FUNCTION log_activity();

-- 3. Trigger for Schedules (Jadwal)
DROP TRIGGER IF EXISTS trigger_log_schedules ON public.schedules;
CREATE TRIGGER trigger_log_schedules 
AFTER INSERT OR UPDATE OR DELETE ON public.schedules 
FOR EACH ROW EXECUTE FUNCTION log_activity();
