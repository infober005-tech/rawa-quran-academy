-- تحقق من تطبيق RLS فعلياً بعد الاسترجاع (قاعدة الاختبار المحلية).
grant usage on schema public to authenticated, anon;
\set stu `psql -h ${RECOVERY_DIR:-/tmp/recovery} -p ${RECOVERY_PORT:-55432} -U postgres -d rawa_test -tAc "select user_id from public.user_roles where role='student' limit 1"`
set role authenticated;
select set_config('request.jwt.claim.sub', :'stu', false);
select 'student_sees_profiles' k, count(*) v from public.profiles
union all select 'student_sees_notifications', count(*) from public.notifications
union all select 'student_sees_halaqas', count(*) from public.halaqas
union all select 'student_sees_audit_logs', count(*) from public.audit_logs;
reset role;
set role anon;
select 'anon_sees_profiles' k, count(*) v from public.profiles
union all select 'anon_sees_payments', count(*) from public.payments;
reset role;