
DROP POLICY IF EXISTS "Members read sessions" ON public.halaqa_sessions;
CREATE POLICY "Members read sessions" ON public.halaqa_sessions
FOR SELECT TO authenticated
USING (
  private.has_role(auth.uid(), 'director'::app_role)
  OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
  OR EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_sessions.halaqa_id AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid()))
  OR (
    EXISTS (SELECT 1 FROM public.student_halaqas sh WHERE sh.halaqa_id = halaqa_sessions.halaqa_id AND sh.student_id = auth.uid())
    AND private.has_active_subscription(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.student_halaqas sh
    JOIN public.parent_links pl ON pl.student_user_id = sh.student_id
    WHERE sh.halaqa_id = halaqa_sessions.halaqa_id AND pl.parent_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "watch recordings" ON public.session_recordings;
CREATE POLICY "watch recordings" ON public.session_recordings
FOR SELECT TO authenticated
USING (
  private.has_role(auth.uid(), 'director'::app_role)
  OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
  OR EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = session_recordings.halaqa_id AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid()))
  OR (
    EXISTS (SELECT 1 FROM public.student_halaqas sh WHERE sh.halaqa_id = session_recordings.halaqa_id AND sh.student_id = auth.uid())
    AND private.has_active_subscription(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.parent_links pl
    JOIN public.student_halaqas sh ON sh.student_id = pl.student_user_id
    WHERE pl.parent_user_id = auth.uid() AND sh.halaqa_id = session_recordings.halaqa_id
  )
);
