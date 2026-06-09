
-- Parent role (idempotent)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- Halaqa meeting + live session fields
ALTER TABLE public.halaqas
  ADD COLUMN IF NOT EXISTS meeting_id text,
  ADD COLUMN IF NOT EXISTS meeting_passcode text,
  ADD COLUMN IF NOT EXISTS live_session_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_session_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS live_session_started_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.halaqas SET meeting_provider = 'google_meet'
  WHERE meeting_provider IS NULL AND meeting_link IS NOT NULL;

ALTER TABLE public.halaqas DROP CONSTRAINT IF EXISTS halaqas_meeting_provider_check;
ALTER TABLE public.halaqas ADD CONSTRAINT halaqas_meeting_provider_check
  CHECK (meeting_provider IS NULL OR meeting_provider IN ('google_meet','zoom','jitsi','other'));

-- halaqa_sessions
CREATE TABLE IF NOT EXISTS public.halaqa_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  halaqa_id uuid NOT NULL REFERENCES public.halaqas(id) ON DELETE CASCADE,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  started_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  meeting_url_override text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS halaqa_sessions_halaqa_idx ON public.halaqa_sessions(halaqa_id, started_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.halaqa_sessions TO authenticated;
GRANT ALL ON public.halaqa_sessions TO service_role;

ALTER TABLE public.halaqa_sessions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS halaqa_sessions_updated_at ON public.halaqa_sessions;
CREATE TRIGGER halaqa_sessions_updated_at BEFORE UPDATE ON public.halaqa_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_parent_of(_parent_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.parent_links
    WHERE parent_user_id = _parent_id AND student_user_id = _student_id);
$$;

DROP POLICY IF EXISTS "Members read sessions" ON public.halaqa_sessions;
CREATE POLICY "Members read sessions" ON public.halaqa_sessions FOR SELECT TO authenticated
  USING (
    public.in_halaqa(auth.uid(), halaqa_id)
    OR public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR EXISTS (SELECT 1 FROM public.student_halaqas sh
      JOIN public.parent_links pl ON pl.student_user_id = sh.student_id
      WHERE sh.halaqa_id = halaqa_sessions.halaqa_id AND pl.parent_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Teacher/supervisor manage sessions" ON public.halaqa_sessions;
CREATE POLICY "Teacher/supervisor manage sessions" ON public.halaqa_sessions FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id
            AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid()))
    OR public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor'))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id
            AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid()))
    OR public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor'));

DROP POLICY IF EXISTS "Parent reads child attendance" ON public.attendance;
CREATE POLICY "Parent reads child attendance" ON public.attendance FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), student_id));

DROP POLICY IF EXISTS "Parent reads child evaluations" ON public.evaluations;
CREATE POLICY "Parent reads child evaluations" ON public.evaluations FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), student_id));

DROP POLICY IF EXISTS "Parent reads child supervisor notes" ON public.supervisor_notes;
CREATE POLICY "Parent reads child supervisor notes" ON public.supervisor_notes FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), student_id));

DROP POLICY IF EXISTS "Parent reads child halaqa memberships" ON public.student_halaqas;
CREATE POLICY "Parent reads child halaqa memberships" ON public.student_halaqas FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), student_id));

DROP POLICY IF EXISTS "Parent reads child halaqas" ON public.halaqas;
CREATE POLICY "Parent reads child halaqas" ON public.halaqas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_halaqas sh
    JOIN public.parent_links pl ON pl.student_user_id = sh.student_id
    WHERE sh.halaqa_id = halaqas.id AND pl.parent_user_id = auth.uid()));

DROP POLICY IF EXISTS "Parent reads child profile" ON public.profiles;
CREATE POLICY "Parent reads child profile" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), id));
