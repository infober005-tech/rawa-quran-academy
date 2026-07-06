
-- Fix 1: Restrict events SELECT — hide draft/cancelled from non-staff; require subscription for students
DROP POLICY IF EXISTS "Anyone authenticated reads events" ON public.events;

CREATE POLICY "Staff reads all events"
ON public.events FOR SELECT TO authenticated
USING (
  private.has_role(auth.uid(), 'director'::app_role)
  OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
);

CREATE POLICY "Users read published events"
ON public.events FOR SELECT TO authenticated
USING (
  status IN ('published','completed')
  AND (
    NOT private.has_role(auth.uid(), 'student'::app_role)
    OR private.has_active_subscription(auth.uid())
  )
);

-- Fix 2: Enforce active subscription in RLS for student-facing paywalled content
DROP POLICY IF EXISTS "Student reads assigned published halaqas" ON public.halaqas;
CREATE POLICY "Student reads assigned published halaqas"
ON public.halaqas FOR SELECT TO authenticated
USING (
  status = 'published'::halaqa_status
  AND private.is_student_in_halaqa(auth.uid(), id)
  AND private.has_active_subscription(auth.uid())
);

DROP POLICY IF EXISTS "Student reads own evaluations" ON public.evaluations;
CREATE POLICY "Student reads own evaluations"
ON public.evaluations FOR SELECT TO authenticated
USING (student_id = auth.uid() AND private.has_active_subscription(auth.uid()));

DROP POLICY IF EXISTS "Student reads own attendance" ON public.attendance;
CREATE POLICY "Student reads own attendance"
ON public.attendance FOR SELECT TO authenticated
USING (student_id = auth.uid() AND private.has_active_subscription(auth.uid()));

DROP POLICY IF EXISTS "Student reads own assignments" ON public.assignments;
CREATE POLICY "Student reads own assignments"
ON public.assignments FOR SELECT TO authenticated
USING (
  (
    student_id = auth.uid()
    OR (
      halaqa_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.student_halaqas sh
        WHERE sh.halaqa_id = assignments.halaqa_id
          AND sh.student_id = auth.uid()
      )
    )
  )
  AND private.has_active_subscription(auth.uid())
);

DROP POLICY IF EXISTS "Student reads own assignment" ON public.student_halaqas;
CREATE POLICY "Student reads own halaqa memberships"
ON public.student_halaqas FOR SELECT TO authenticated
USING (student_id = auth.uid() AND private.has_active_subscription(auth.uid()));
