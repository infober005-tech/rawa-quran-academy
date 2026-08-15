// إدخال بيانات auth.users الوصفية في قاعدة الاختبار المحلية (بدون كلمات مرور).
// للاستعمال داخل run_recovery_test.sh فقط.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const dir = process.env.RECOVERY_DIR || '/tmp/recovery';
const port = process.env.RECOVERY_PORT || '55432';
const file = new URL('../data/_auth_users_metadata.json', import.meta.url);
const users = JSON.parse(readFileSync(file, 'utf8'));
const q = (v) => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const sql = users
  .map(
    (u) =>
      `insert into auth.users(id,email,phone,email_confirmed_at,created_at,last_sign_in_at,raw_user_meta_data) values (${q(u.id)},${q(u.email)},${q(u.phone)},${q(u.email_confirmed_at)},${q(u.created_at)},${q(u.last_sign_in_at)},${q(JSON.stringify(u.user_metadata))}::jsonb);`,
  )
  .join('\n');
execFileSync('psql', ['-h', dir, '-p', port, '-U', 'postgres', '-d', 'rawa_test', '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql], { stdio: 'inherit' });
console.log(`  auth users inserted: ${users.length} (no passwords, no tokens)`);