
DROP POLICY IF EXISTS "Teacher reads own halaqas" ON public.halaqas;
CREATE POLICY "Teacher reads own halaqas" ON public.halaqas
  FOR SELECT USING (teacher_id = auth.uid() AND status <> 'draft');

DROP POLICY IF EXISTS "Supervisor reads own halaqas" ON public.halaqas;
CREATE POLICY "Supervisor reads own halaqas" ON public.halaqas
  FOR SELECT USING (supervisor_id = auth.uid() AND status <> 'draft');

DROP POLICY IF EXISTS "Parent reads child halaqas" ON public.halaqas;
CREATE POLICY "Parent reads child halaqas" ON public.halaqas
  FOR SELECT USING (
    status <> 'draft' AND EXISTS (
      SELECT 1 FROM student_halaqas sh
      JOIN parent_links pl ON pl.student_user_id = sh.student_id
      WHERE sh.halaqa_id = halaqas.id AND pl.parent_user_id = auth.uid()
    )
  );
