
-- Revoke default PUBLIC execute on every SECURITY DEFINER function we own
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.primary_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.in_halaqa(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon, authenticated;

-- Helpers used inside RLS expressions need EXECUTE for the role the policy targets.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.primary_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.in_halaqa(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

-- Trigger / internal-only functions: not callable by clients at all
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_halaqa_gender() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_student_halaqa_gender() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_event_published() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_halaqa_activated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_payment_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_on_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_live_session_started() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_evaluation_submitted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_attendance_marked() FROM PUBLIC, anon, authenticated;
