CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_code TEXT UNIQUE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  emergency_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own record"
  ON public.students FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Staff view all students"
  ON public.students FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.has_role(auth.uid(), 'halaqa_supervisor')
    OR public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Directors manage students"
  ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

CREATE TRIGGER students_set_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX students_profile_id_idx ON public.students(profile_id);