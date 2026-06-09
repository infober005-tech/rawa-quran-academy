
CREATE TYPE public.supervisor_note_category AS ENUM ('behavior','attendance','technical','follow_up');

CREATE TABLE public.supervisor_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  halaqa_id UUID NOT NULL REFERENCES public.halaqas(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.supervisor_note_category NOT NULL DEFAULT 'follow_up',
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supervisor_notes TO authenticated;
GRANT ALL ON public.supervisor_notes TO service_role;

ALTER TABLE public.supervisor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Director manages supervisor notes" ON public.supervisor_notes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'director'))
  WITH CHECK (has_role(auth.uid(),'director'));

CREATE POLICY "General supervisor reads notes" ON public.supervisor_notes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'general_supervisor'));

CREATE POLICY "Halaqa staff reads notes" ON public.supervisor_notes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = supervisor_notes.halaqa_id AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid())));

CREATE POLICY "Student reads own notes" ON public.supervisor_notes
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Supervisor creates notes" ON public.supervisor_notes
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = supervisor_notes.halaqa_id AND h.supervisor_id = auth.uid()));

CREATE POLICY "Author updates own notes" ON public.supervisor_notes
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Author deletes own notes" ON public.supervisor_notes
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());
