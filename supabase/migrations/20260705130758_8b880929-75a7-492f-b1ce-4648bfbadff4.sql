
-- 1. Helpers in private schema (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION private.is_student_in_halaqa(_user_id uuid, _halaqa_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.student_halaqas WHERE halaqa_id = _halaqa_id AND student_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION private.is_parent_child_in_halaqa(_parent_id uuid, _halaqa_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_halaqas sh
    JOIN public.parent_links pl ON pl.student_user_id = sh.student_id
    WHERE sh.halaqa_id = _halaqa_id AND pl.parent_user_id = _parent_id
  );
$$;

CREATE OR REPLACE FUNCTION private.is_staff_for_halaqa(_user_id uuid, _halaqa_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.halaqas WHERE id = _halaqa_id AND (teacher_id = _user_id OR supervisor_id = _user_id)
  );
$$;

-- 2. Drop existing halaqas policies
DROP POLICY IF EXISTS "Director manages halaqas" ON public.halaqas;
DROP POLICY IF EXISTS "Staff read all halaqas" ON public.halaqas;
DROP POLICY IF EXISTS "Teacher reads own halaqas" ON public.halaqas;
DROP POLICY IF EXISTS "Supervisor reads own halaqas" ON public.halaqas;
DROP POLICY IF EXISTS "Parent reads child halaqas" ON public.halaqas;
DROP POLICY IF EXISTS "Student reads assigned published halaqas" ON public.halaqas;
DROP POLICY IF EXISTS "Teacher updates own halaqas" ON public.halaqas;
DROP POLICY IF EXISTS "Supervisor updates own halaqas" ON public.halaqas;

-- 3. Rebuild halaqas policies — none query public.halaqas or student_halaqas directly
CREATE POLICY "Director manages halaqas" ON public.halaqas
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'director'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));

CREATE POLICY "General supervisor reads all halaqas" ON public.halaqas
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'general_supervisor'::app_role));

CREATE POLICY "Teacher reads assigned halaqas" ON public.halaqas
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() AND status <> 'draft'::halaqa_status);

CREATE POLICY "Teacher updates assigned halaqas" ON public.halaqas
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Supervisor reads assigned halaqas" ON public.halaqas
  FOR SELECT TO authenticated
  USING (supervisor_id = auth.uid() AND status <> 'draft'::halaqa_status);

CREATE POLICY "Supervisor updates assigned halaqas" ON public.halaqas
  FOR UPDATE TO authenticated
  USING (supervisor_id = auth.uid())
  WITH CHECK (supervisor_id = auth.uid());

CREATE POLICY "Student reads assigned published halaqas" ON public.halaqas
  FOR SELECT TO authenticated
  USING (status = 'published'::halaqa_status AND private.is_student_in_halaqa(auth.uid(), id));

CREATE POLICY "Parent reads child published halaqas" ON public.halaqas
  FOR SELECT TO authenticated
  USING (status = 'published'::halaqa_status AND private.is_parent_child_in_halaqa(auth.uid(), id));

-- 4. Fix student_halaqas staff policy to avoid querying halaqas via RLS
DROP POLICY IF EXISTS "Staff reads assignments" ON public.student_halaqas;
CREATE POLICY "Staff reads assignments" ON public.student_halaqas
  FOR SELECT TO authenticated
  USING (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR private.is_staff_for_halaqa(auth.uid(), halaqa_id)
  );
