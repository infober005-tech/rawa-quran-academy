// READ-ONLY export of auth.users metadata (NO passwords, NO tokens, NO secrets).
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/backups/export_auth_users.mjs
import { writeFileSync } from 'node:fs';
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
const out = [];
for (let page = 1; ; page++) {
  const r = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const { users } = await r.json();
  if (!users?.length) break;
  out.push(...users);
  if (users.length < 200) break;
}
const safe = out.map((u) => ({
  id: u.id, email: u.email, phone: u.phone || null,
  email_confirmed_at: u.email_confirmed_at ?? null,
  created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null,
  providers: u.app_metadata?.providers ?? [], user_metadata: u.user_metadata ?? {},
}));
writeFileSync('supabase/backups/data/_auth_users_metadata.json', JSON.stringify(safe, null, 2));
const cols = ['id','email','phone','email_confirmed_at','created_at','last_sign_in_at','providers'];
const esc = (v) => `"${String(v ?? '').replace(/"/g,'""')}"`;
writeFileSync('supabase/backups/data/_auth_users_metadata.csv',
  [cols.join(','), ...safe.map(u => cols.map(c => esc(Array.isArray(u[c]) ? u[c].join('|') : u[c])).join(','))].join('\n') + '\n');
console.log('exported users:', safe.length);
