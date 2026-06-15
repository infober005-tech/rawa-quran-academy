
-- ============ Session recordings ============
CREATE TABLE IF NOT EXISTS public.session_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.halaqa_sessions(id) ON DELETE CASCADE,
  halaqa_id uuid NOT NULL REFERENCES public.halaqas(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  duration_seconds integer,
  size_bytes bigint,
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_recordings TO authenticated;
GRANT ALL ON public.session_recordings TO service_role;

ALTER TABLE public.session_recordings ENABLE ROW LEVEL SECURITY;

-- Watch: halaqa members (teacher/supervisor/student), parents of those students, directors, general supervisors
CREATE POLICY "watch recordings"
  ON public.session_recordings FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.in_halaqa(auth.uid(), halaqa_id)
    OR EXISTS (
      SELECT 1 FROM public.parent_links pl
      JOIN public.student_halaqas sh ON sh.student_id = pl.student_user_id
      WHERE pl.parent_user_id = auth.uid() AND sh.halaqa_id = session_recordings.halaqa_id
    )
  );

-- Upload: the halaqa's teacher (or supervisor/director)
CREATE POLICY "upload recordings"
  ON public.session_recordings FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      public.has_role(auth.uid(), 'director')
      OR public.has_role(auth.uid(), 'general_supervisor')
      OR EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid()))
    )
  );

-- Update title (teacher / supervisor / director)
CREATE POLICY "edit recordings"
  ON public.session_recordings FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid()))
  );

-- Moderate (delete): supervisor or director only
CREATE POLICY "moderate recordings"
  ON public.session_recordings FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.has_role(auth.uid(), 'halaqa_supervisor')
  );

-- Storage policies on the existing private `recordings` bucket
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "recordings read" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "recordings write" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "recordings delete" ON storage.objects';
END $$;

CREATE POLICY "recordings read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'recordings' AND EXISTS (
      SELECT 1 FROM public.session_recordings sr
      WHERE sr.file_path = storage.objects.name
        AND (
          public.has_role(auth.uid(), 'director')
          OR public.has_role(auth.uid(), 'general_supervisor')
          OR public.in_halaqa(auth.uid(), sr.halaqa_id)
          OR EXISTS (
            SELECT 1 FROM public.parent_links pl
            JOIN public.student_halaqas sh ON sh.student_id = pl.student_user_id
            WHERE pl.parent_user_id = auth.uid() AND sh.halaqa_id = sr.halaqa_id
          )
        )
    )
  );

CREATE POLICY "recordings write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'recordings' AND owner = auth.uid()
  );

CREATE POLICY "recordings delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'recordings' AND (
      public.has_role(auth.uid(), 'director')
      OR public.has_role(auth.uid(), 'general_supervisor')
      OR public.has_role(auth.uid(), 'halaqa_supervisor')
      OR owner = auth.uid()
    )
  );

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.session_recordings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ Realtime notification triggers ============

-- Live session started
CREATE OR REPLACE FUNCTION public.notify_live_session_started()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NEW.live_session_active = true AND (TG_OP = 'INSERT' OR OLD.live_session_active IS DISTINCT FROM true) THEN
    FOR r IN
      SELECT sh.student_id AS uid FROM public.student_halaqas sh WHERE sh.halaqa_id = NEW.id
      UNION
      SELECT NEW.supervisor_id WHERE NEW.supervisor_id IS NOT NULL
    LOOP
      IF r.uid IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, content, link)
        VALUES (r.uid, '🟢 الحلقة بدأت الآن', 'انضم إلى حلقة ' || NEW.name, '/dashboard');
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_live_session_started ON public.halaqas;
CREATE TRIGGER trg_notify_live_session_started
  AFTER INSERT OR UPDATE OF live_session_active ON public.halaqas
  FOR EACH ROW EXECUTE FUNCTION public.notify_live_session_started();

-- Evaluation submitted
CREATE OR REPLACE FUNCTION public.notify_evaluation_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  INSERT INTO public.notifications (user_id, title, content, link)
  VALUES (NEW.student_id, '⭐ تقييم جديد', 'تم تسجيل تقييم جديد لك.', '/dashboard');
  FOR r IN SELECT parent_user_id AS uid FROM public.parent_links WHERE student_user_id = NEW.student_id LOOP
    INSERT INTO public.notifications (user_id, title, content, link)
    VALUES (r.uid, '⭐ تقييم جديد لابنك/ابنتك', 'تم تسجيل تقييم جديد.', '/dashboard');
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_evaluation_submitted ON public.evaluations;
CREATE TRIGGER trg_notify_evaluation_submitted
  AFTER INSERT ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.notify_evaluation_submitted();

-- Attendance marked
CREATE OR REPLACE FUNCTION public.notify_attendance_marked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; label text;
BEGIN
  label := CASE NEW.status
    WHEN 'present' THEN '✅ حاضر'
    WHEN 'late' THEN '⏰ متأخر'
    WHEN 'absent' THEN '❌ غائب'
    ELSE NEW.status::text
  END;
  INSERT INTO public.notifications (user_id, title, content, link)
  VALUES (NEW.student_id, 'تم تسجيل الحضور', label || ' بتاريخ ' || NEW.date::text, '/dashboard');
  FOR r IN SELECT parent_user_id AS uid FROM public.parent_links WHERE student_user_id = NEW.student_id LOOP
    INSERT INTO public.notifications (user_id, title, content, link)
    VALUES (r.uid, 'حضور ابنك/ابنتك', label || ' بتاريخ ' || NEW.date::text, '/dashboard');
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_attendance_marked ON public.attendance;
CREATE TRIGGER trg_notify_attendance_marked
  AFTER INSERT OR UPDATE OF status ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.notify_attendance_marked();
