
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated, anon;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_parent_of(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.in_halaqa(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.is_conversation_member(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.primary_role(uuid) SET SCHEMA private;
ALTER FUNCTION public.has_active_subscription(uuid) SET SCHEMA private;
ALTER FUNCTION public.can_submit_payment(uuid) SET SCHEMA private;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_parent_of(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.in_halaqa(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.primary_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_active_subscription(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_submit_payment(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_parent_of(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.in_halaqa(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_conversation_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.primary_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_active_subscription(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_submit_payment(uuid) TO authenticated, service_role;

-- Ensure unqualified references inside existing RLS policies still resolve.
ALTER ROLE authenticated SET search_path = "$user", public, private, extensions;
ALTER ROLE anon SET search_path = "$user", public, private, extensions;
ALTER ROLE service_role SET search_path = "$user", public, private, extensions;
