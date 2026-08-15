// إنشاء مستخدمي auth في مشروع جديد بنفس الـ id للحفاظ على كل العلاقات.
// بلا كلمات مرور: كل مستخدم يستعيدها عبر "نسيت كلمة المرور" أو يدخل بـ Google.
// export SUPABASE_URL="https://<new-project>.supabase.co"
// export SUPABASE_SERVICE_ROLE_KEY="<من إعدادات المشروع الجديد>"
// node supabase/backups/restore_auth_users.mjs
// مهم: عطّل trigger on_auth_user_created قبل التشغيل، أو استورد profiles/user_roles بعده.
import { readFileSync } from 'node:fs';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
const users = JSON.parse(readFileSync(new URL('./data/_auth_users_metadata.json', import.meta.url), 'utf8'));
let ok = 0;
for (const u of users) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: u.id,
      email: u.email,
      email_confirm: Boolean(u.email_confirmed_at),
      user_metadata: u.user_metadata ?? {},
    }),
  });
  console.log(`${res.ok ? 'OK  ' : 'FAIL'} ${u.email}${res.ok ? '' : ' -> ' + (await res.text())}`);
  if (res.ok) ok++;
}
console.log(`created: ${ok}/${users.length}`);