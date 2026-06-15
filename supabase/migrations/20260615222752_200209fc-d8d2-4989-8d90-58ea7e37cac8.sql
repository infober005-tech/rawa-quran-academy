
-- Link attendance & evaluations to a specific session, add behavior, enable realtime
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.halaqa_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.halaqa_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS behavior_score integer;

DO $$ BEGIN
  ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_behavior_score_check CHECK (behavior_score IS NULL OR (behavior_score >= 0 AND behavior_score <= 100));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS attendance_session_idx ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS evaluations_session_idx ON public.evaluations(session_id);
CREATE INDEX IF NOT EXISTS evaluations_student_idx ON public.evaluations(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS attendance_student_idx ON public.attendance(student_id, date DESC);

-- Realtime for live updates to students/parents/supervisors/directors
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.halaqa_sessions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
