#!/usr/bin/env bash
# اختبار استرجاع كامل في قاعدة PostgreSQL محلية معزولة.
# لا يتصل إطلاقاً بمشروع Rawa الأصلي ولا ينفّذ عليه أي أمر.
# الاستخدام:  bash supabase/backups/recovery/run_recovery_test.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
B="$ROOT/supabase/backups"
DIR="${RECOVERY_DIR:-/tmp/recovery}"
PORT="${RECOVERY_PORT:-55432}"
PSQL="psql -h $DIR -p $PORT -U postgres -d rawa_test"

mkdir -p "$DIR"
rm -rf "$DIR/pgdata"
initdb -D "$DIR/pgdata" -U postgres --auth=trust -E UTF8 >"$DIR/init.log" 2>&1
pg_ctl -D "$DIR/pgdata" -o "-p $PORT -k $DIR" -l "$DIR/pg.log" start
sleep 3

psql -h "$DIR" -p "$PORT" -U postgres -q -c "CREATE DATABASE rawa_test"
echo "== 1) بيئة Supabase الوهمية (auth/storage/roles) =="
psql -h "$DIR" -p "$PORT" -U postgres -d rawa_test -q -v ON_ERROR_STOP=1 -f "$B/recovery/00_supabase_shim.sql"

echo "== 2) Schema + Enums + Constraints + Functions + Triggers + RLS + GRANTs + Buckets =="
$PSQL -v ON_ERROR_STOP=1 -q -f "$B/20260814_full_schema_snapshot.sql"

echo "== 3) جرد ما تم إنشاؤه =="
$PSQL -c "select 'tables' k, count(*) v from pg_tables where schemaname='public'
union all select 'enums', count(*) from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typtype='e'
union all select 'constraints', count(*) from pg_constraint c join pg_class r on r.oid=c.conrelid join pg_namespace n on n.oid=r.relnamespace where n.nspname='public'
union all select 'functions', count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')
union all select 'triggers', count(*) from pg_trigger where not tgisinternal
union all select 'policies', count(*) from pg_policies where schemaname in ('public','storage')
union all select 'buckets', count(*) from storage.buckets;"

echo "== 4) مستخدمو auth (بيانات وصفية فقط، بلا كلمات مرور) =="
RECOVERY_DIR="$DIR" RECOVERY_PORT="$PORT" node "$B/recovery/import_auth_metadata.mjs"

echo "== 5) استرجاع بيانات public بترتيب الـ Foreign Keys =="
for t in profiles user_roles students halaqas student_halaqas halaqa_sessions attendance_sessions attendance evaluations assignments assignment_submissions supervisor_notes session_recordings events event_registrations parent_links payment_settings payments subscriptions notifications conversations conversation_members messages audit_logs; do
  rows=$(( $(wc -l < "$B/data/$t.csv") - 1 ))
  if [ "$rows" -gt 0 ]; then
    $PSQL -q -c "\copy public.$t FROM '$B/data/$t.csv' WITH CSV HEADER" && echo "  OK   $t ($rows)"
  else echo "  skip $t (0 rows)"; fi
done

echo "== 6) Realtime =="
$PSQL -q -c "ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance, public.attendance_sessions, public.conversations, public.conversation_members, public.evaluations, public.halaqa_sessions, public.messages, public.session_recordings, public.subscriptions;"
$PSQL -tAc "select count(*)||' realtime tables' from pg_publication_tables where pubname='supabase_realtime';"

echo "== 7) تكامل العلاقات + الدوال + التريجرز + RLS =="
$PSQL -tAc "select 'orphan profiles: '||count(*) from public.profiles p left join auth.users u on u.id=p.id where u.id is null;"
$PSQL -tAc "select 'has_role(director)= '||private.has_role((select user_id from public.user_roles where role='director' limit 1),'director'::app_role);"
$PSQL -q -c "select public.process_subscription_reminders();" && echo "  process_subscription_reminders() OK"
$PSQL -q -c "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();"
$PSQL -q -c "insert into auth.users(email, raw_user_meta_data) values ('recovery-test@example.com','{\"full_name\":\"Recovery Test\",\"gender\":\"male\",\"quran_level\":\"beginner\",\"language\":\"ar\"}'::jsonb);"
$PSQL -tAc "select 'trigger created profile+role: '||(select count(*) from public.profiles where email='recovery-test@example.com')||'/'||(select count(*) from public.user_roles ur join auth.users u on u.id=ur.user_id where u.email='recovery-test@example.com');"
$PSQL -q -f "$B/recovery/rls_checks.sql"

echo "== انتهى. لإيقاف بيئة الاختبار: pg_ctl -D $DIR/pgdata stop =="