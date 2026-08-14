#!/usr/bin/env bash
# READ-ONLY data snapshot for Rawa Quran Academy (public schema).
# Usage: bash supabase/backups/generate_data_snapshot.sh
set -e
DIR="$(dirname "$0")/data"
mkdir -p "$DIR"
# FK-safe restore order (parents first)
TABLES="profiles user_roles students halaqas student_halaqas halaqa_sessions attendance_sessions attendance evaluations assignments assignment_submissions supervisor_notes session_recordings events event_registrations parent_links payment_settings payments subscriptions notifications conversations conversation_members messages audit_logs"
: > "$DIR/_manifest.tsv"
printf 'table\trows\tbytes\n' >> "$DIR/_manifest.tsv"
for t in $TABLES; do
  psql -c "\copy (SELECT * FROM public.$t) TO '$DIR/$t.csv' WITH CSV HEADER" >/dev/null
  rows=$(( $(wc -l < "$DIR/$t.csv") - 1 ))
  bytes=$(wc -c < "$DIR/$t.csv")
  printf '%s\t%s\t%s\n' "$t" "$rows" "$bytes" >> "$DIR/_manifest.tsv"
done
