// نسخ ملفات Storage الفعلية (تنزيل) — READ ONLY، لا يحذف ولا يعدّل شيئاً.
// تشغيل محلي فقط: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node copy_storage_files.mjs ./storage-files
// المفتاح يُقرأ من البيئة ولا يُخزَّن في المستودع أبداً.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dest = process.argv[2] || './storage-files';
if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
const h = { apikey: key, Authorization: `Bearer ${key}` };
const buckets = await (await fetch(`${url}/storage/v1/bucket`, { headers: h })).json();
let count = 0, bytes = 0;
async function walk(bucket, prefix = '') {
  const r = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
    method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
  });
  for (const o of await r.json()) {
    const path = prefix ? `${prefix}/${o.name}` : o.name;
    if (!o.id) { await walk(bucket, path); continue; }
    const f = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, { headers: h });
    const buf = Buffer.from(await f.arrayBuffer());
    const target = join(dest, bucket, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, buf);
    count++; bytes += buf.length;
    console.log(`${bucket}/${path} (${buf.length} B)`);
  }
}
for (const b of buckets) await walk(b.id);
console.log(`\nfiles: ${count}, total bytes: ${bytes}`);
