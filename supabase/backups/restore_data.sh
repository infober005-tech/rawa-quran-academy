#!/usr/bin/env bash
# استرجاع بيانات جداول public من ملفات CSV إلى مشروع Supabase جديد.
# شغّله بعد تنفيذ 20260814_full_schema_snapshot.sql وبعد إنشاء مستخدمي auth.
# يتطلب متغيرات PG* الخاصة بالمشروع الجديد.
set -e
DIR="$(dirname "$0")/data"
TABLES="profiles user_roles students halaqas student_halaqas halaqa_sessions attendance_sessions attendance evaluations assignments assignment_submissions supervisor_notes session_recordings events event_registrations parent_links payment_settings payments subscriptions notifications conversations conversation_members messages audit_logs"
# تعطيل التريجرز أثناء الاستيراد يحتاج صلاحيات مالك الجدول (اختياري)
for t in $TABLES; do
  [ -s "$DIR/$t.csv" ] || continue
  rows=$(( $(wc -l < "$DIR/$t.csv") - 1 ))
  [ "$rows" -gt 0 ] || { echo "skip $t (0 rows)"; continue; }
  echo "restoring $t ($rows rows)"
  psql -c "\copy public.$t FROM '$DIR/$t.csv' WITH CSV HEADER"
done
echo "done"
