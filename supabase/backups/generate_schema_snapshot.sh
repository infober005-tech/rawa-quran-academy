set -e
OUT=$1
q() { psql -At -F $'\t' -c "$1"; }
echo "-- ============================================" > $OUT
echo "-- Rawa Quran Academy — full schema snapshot" >> $OUT
echo "-- generated: $(date -u)" >> $OUT
echo "-- schemas: public, private" >> $OUF 2>/dev/null || true
echo "-- ============================================" >> $OUT

echo "" >> $OUT; echo "-- ---------- SCHEMAS ----------" >> $OUT
q "select 'CREATE SCHEMA IF NOT EXISTS '||quote_ident(nspname)||';' from pg_namespace where nspname in ('public','private')" >> $OUT

echo "" >> $OUT; echo "-- ---------- ENUM TYPES ----------" >> $OUT
q "select 'CREATE TYPE '||n.nspname||'.'||t.typname||' AS ENUM ('||string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder)||');'
from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid
where n.nspname in ('public','private') group by n.nspname,t.typname order by 1" >> $OUT

echo "" >> $OUT; echo "-- ---------- TABLES ----------" >> $OUT
q "select 'CREATE TABLE IF NOT EXISTS '||c.relnamespace::regnamespace||'.'||quote_ident(c.relname)||' ('||E'\n  '||
 string_agg(quote_ident(a.attname)||' '||format_type(a.atttypid,a.atttypmod)||
   coalesce(' DEFAULT '||pg_get_expr(ad.adbin,ad.adrelid),'')||
   case when a.attnotnull then ' NOT NULL' else '' end, E',\n  ' order by a.attnum)||E'\n);'
from pg_class c join pg_namespace n on n.oid=c.relnamespace
join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
left join pg_attrdef ad on ad.adrelid=c.oid and ad.adnum=a.attnum
where n.nspname in ('public','private') and c.relkind='r'
group by c.oid,c.relnamespace,c.relname order by c.relname" >> $OUT

echo "" >> $OUT; echo "-- ---------- CONSTRAINTS (PK / UNIQUE / CHECK / FK) ----------" >> $OUT
q "select 'ALTER TABLE '||conrelid::regclass||' ADD CONSTRAINT '||quote_ident(conname)||' '||pg_get_constraintdef(oid)||';'
from pg_constraint where connamespace::regnamespace::text in ('public','private')
order by case contype when 'p' then 1 when 'u' then 2 when 'c' then 3 else 4 end, conname" >> $OUT

echo "" >> $OUT; echo "-- ---------- INDEXES (non-constraint) ----------" >> $OUT
q "select indexdef||';' from pg_indexes i where schemaname in ('public','private')
and not exists (select 1 from pg_constraint c where c.conname=i.indexname and c.connamespace::regnamespace::text=i.schemaname)
order by indexname" >> $OUT

echo "" >> $OUT; echo "-- ---------- FUNCTIONS (incl. SECURITY DEFINER) ----------" >> $OUT
q "select pg_get_functiondef(p.oid)||E';\n' from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and p.prokind in ('f','p') order by n.nspname,p.proname" >> $OUT

echo "" >> $OUT; echo "-- ---------- VIEWS ----------" >> $OUT
q "select 'CREATE OR REPLACE VIEW '||schemaname||'.'||viewname||' AS '||E'\n'||definition from pg_views where schemaname in ('public','private') order by viewname" >> $OUT
q "select 'CREATE MATERIALIZED VIEW IF NOT EXISTS '||schemaname||'.'||matviewname||' AS '||E'\n'||definition from pg_matviews where schemaname in ('public','private')" >> $OUT

echo "" >> $OUT; echo "-- ---------- TRIGGERS ----------" >> $OUT
q "select pg_get_triggerdef(t.oid)||';' from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('public','private')
order by c.relname,t.tgname" >> $OUT

echo "" >> $OUT; echo "-- ---------- AUTH TRIGGERS ON auth.users (recreate manually if needed) ----------" >> $OUT
q "select '-- '||pg_get_triggerdef(t.oid)||';' from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='auth'" >> $OUT

echo "" >> $OUT; echo "-- ---------- GRANTS ----------" >> $OUT
q "select 'GRANT '||string_agg(distinct privilege_type,', ')||' ON '||table_schema||'.'||quote_ident(table_name)||' TO '||quote_ident(grantee)||';'
from information_schema.role_table_grants where table_schema in ('public','private') and grantee in ('anon','authenticated','service_role')
group by table_schema,table_name,grantee order by table_name,grantee" >> $OUT

echo "" >> $OUT; echo "-- ---------- ROW LEVEL SECURITY ----------" >> $OUT
q "select 'ALTER TABLE '||n.nspname||'.'||quote_ident(c.relname)||' ENABLE ROW LEVEL SECURITY;'
from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relrowsecurity and n.nspname in ('public','private') order by c.relname" >> $OUT

echo "" >> $OUT; echo "-- ---------- RLS POLICIES ----------" >> $OUT
q "select 'CREATE POLICY '||quote_ident(pol.polname)||' ON '||n.nspname||'.'||quote_ident(c.relname)||
 ' AS '||case when pol.polpermissive then 'PERMISSIVE' else 'RESTRICTIVE' end||
 ' FOR '||case pol.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT' when 'w' then 'UPDATE' when 'd' then 'DELETE' else 'ALL' end||
 ' TO '||coalesce((select string_agg(quote_ident(rolname),', ') from pg_roles where oid=any(pol.polroles)),'public')||
 coalesce(' USING ('||pg_get_expr(pol.polqual,pol.polrelid)||')','')||
 coalesce(' WITH CHECK ('||pg_get_expr(pol.polwithcheck,pol.polrelid)||')','')||';'
from pg_policy pol join pg_class c on c.oid=pol.polrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private') order by c.relname,pol.polname" >> $OUT

echo "" >> $OUT; echo "-- ---------- STORAGE BUCKETS ----------" >> $OUT
q "select 'INSERT INTO storage.buckets (id,name,public) VALUES ('||quote_literal(id)||','||quote_literal(name)||','||public||') ON CONFLICT (id) DO NOTHING;' from storage.buckets order by id" >> $OUT

echo "" >> $OUT; echo "-- ---------- STORAGE POLICIES (storage.objects) ----------" >> $OUT
q "select 'CREATE POLICY '||quote_ident(pol.polname)||' ON storage.objects FOR '||
 case pol.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT' when 'w' then 'UPDATE' when 'd' then 'DELETE' else 'ALL' end||
 ' TO '||coalesce((select string_agg(quote_ident(rolname),', ') from pg_roles where oid=any(pol.polroles)),'public')||
 coalesce(' USING ('||pg_get_expr(pol.polqual,pol.polrelid)||')','')||
 coalesce(' WITH CHECK ('||pg_get_expr(pol.polwithcheck,pol.polrelid)||')','')||';'
from pg_policy pol join pg_class c on c.oid=pol.polrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='storage' and c.relname='objects' order by pol.polname" >> $OUT

echo "" >> $OUT; echo "-- ---------- REALTIME PUBLICATION ----------" >> $OUT
q "select '-- publication supabase_realtime includes: '||schemaname||'.'||tablename from pg_publication_tables where pubname='supabase_realtime'" >> $OUT

echo "" >> $OUT; echo "-- ---------- ROW COUNTS AT BACKUP TIME (reference only) ----------" >> $OUT
q "select '-- '||relname||': '||n_live_tup from pg_stat_user_tables where schemaname='public' order by relname" >> $OUT
