-- 1) payment_settings: restrict SELECT to students & directors (those who actually need payment instructions)
DROP POLICY IF EXISTS "settings_read_all_auth" ON public.payment_settings;
CREATE POLICY "settings_read_students_directors" ON public.payment_settings
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'director'::public.app_role)
    OR public.has_role(auth.uid(), 'student'::public.app_role)
  );

-- 2) audit_logs: remove user-controlled INSERT. Inserts come from SECURITY DEFINER triggers (which bypass RLS).
DROP POLICY IF EXISTS "audit_self_insert" ON public.audit_logs;
REVOKE INSERT ON public.audit_logs FROM authenticated, anon;

-- 3) halaqas: protect meeting_id / meeting_passcode at the column level (no app code reads them today).
REVOKE ALL ON public.halaqas FROM authenticated;
GRANT SELECT (
  id, name, gender, level, teacher_id, supervisor_id, schedule, meeting_link,
  description, status, created_at, updated_at, start_time, end_time, max_students,
  meeting_provider, schedule_days, live_session_active, live_session_started_at,
  live_session_started_by
) ON public.halaqas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.halaqas TO authenticated;

-- 4) SECURITY DEFINER functions: revoke broad EXECUTE; grant only to those needed by RLS / client.
REVOKE EXECUTE ON FUNCTION public.audit_payment_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_on_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_halaqa_gender() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_student_halaqa_gender() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_payment_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_attendance_marked() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_evaluation_submitted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_event_published() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_halaqa_activated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_live_session_started() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_subscription_reminders() FROM PUBLIC, anon, authenticated;

-- Helper functions used by RLS policies and client queries: revoke from public/anon, grant to authenticated only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.primary_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.in_halaqa(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_submit_payment(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.primary_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.in_halaqa(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_submit_payment(uuid) TO authenticated;
