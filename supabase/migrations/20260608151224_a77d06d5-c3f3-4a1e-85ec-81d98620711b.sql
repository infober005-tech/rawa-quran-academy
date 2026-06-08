-- Add 'inactive' status value (non-blocking; usage in later migrations/app)
ALTER TYPE public.halaqa_status ADD VALUE IF NOT EXISTS 'inactive';

-- Extend halaqas
ALTER TABLE public.halaqas
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS max_students integer,
  ADD COLUMN IF NOT EXISTS meeting_provider text,
  ADD COLUMN IF NOT EXISTS schedule_days text[];

-- Extend events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS speaker text,
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS meeting_provider text,
  ADD COLUMN IF NOT EXISTS registration_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_participants integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Event registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User manages own registration" ON public.event_registrations;
CREATE POLICY "User manages own registration" ON public.event_registrations
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'director'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "Director reads all registrations" ON public.event_registrations;
CREATE POLICY "Director reads all registrations" ON public.event_registrations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'general_supervisor'));

-- Notification trigger for halaqas: when activated, notify teacher, supervisor, matching-gender approved students
CREATE OR REPLACE FUNCTION public.notify_halaqa_activated()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    IF NEW.teacher_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (NEW.teacher_id, 'حلقة جديدة: ' || NEW.name, 'تم تعيينك في حلقة', '/halaqas');
    END IF;
    IF NEW.supervisor_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (NEW.supervisor_id, 'حلقة جديدة: ' || NEW.name, 'تم تعيينك مشرفاً للحلقة', '/halaqas');
    END IF;
    FOR r IN
      SELECT p.id FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
      WHERE p.gender = NEW.gender AND p.status = 'approved'
    LOOP
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (r.id, 'حلقة جديدة متاحة: ' || NEW.name, COALESCE(NEW.description, ''), '/halaqas');
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS halaqas_notify ON public.halaqas;
CREATE TRIGGER halaqas_notify AFTER INSERT OR UPDATE ON public.halaqas
FOR EACH ROW EXECUTE FUNCTION public.notify_halaqa_activated();

-- Notification trigger for events: when published, notify all approved users
CREATE OR REPLACE FUNCTION public.notify_event_published()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    FOR r IN SELECT id FROM public.profiles WHERE status = 'approved' LOOP
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (r.id, 'فعالية جديدة: ' || NEW.title, COALESCE(NEW.description, ''), '/events');
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS events_notify ON public.events;
CREATE TRIGGER events_notify AFTER INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.notify_event_published();