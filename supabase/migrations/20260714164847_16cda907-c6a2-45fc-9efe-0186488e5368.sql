
CREATE TABLE public.attendance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  halaqa_id UUID NOT NULL REFERENCES public.halaqas(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX attendance_sessions_token_idx ON public.attendance_sessions(token);
CREATE INDEX attendance_sessions_halaqa_idx ON public.attendance_sessions(halaqa_id);

GRANT SELECT, INSERT, UPDATE ON public.attendance_sessions TO authenticated;
GRANT ALL ON public.attendance_sessions TO service_role;

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher can create own attendance sessions"
  ON public.attendance_sessions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = teacher_id
    AND EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND h.teacher_id = auth.uid())
  );

CREATE POLICY "Teacher can update own attendance sessions"
  ON public.attendance_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teacher and enrolled students can view sessions"
  ON public.attendance_sessions FOR SELECT TO authenticated
  USING (
    auth.uid() = teacher_id
    OR EXISTS (
      SELECT 1 FROM public.student_halaqas sh
      WHERE sh.halaqa_id = attendance_sessions.halaqa_id
        AND sh.student_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
