// رفع ملفات Storage المنسوخة إلى مشروع جديد بنفس شجرة bucket/path.
// لا يحتوي أي مفتاح: يقرأ من متغيرات البيئة فقط.
// export SUPABASE_URL="https://<new-project>.supabase.co"
// export SUPABASE_SERVICE_ROLE_KEY="<من إعدادات المشروع الجديد>"
// node supabase/backups/restore_storage_files.mjs ./storage-files
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const src = process.argv[2] || './storage-files';
if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
const h = { apikey: key, Authorization: `Bearer ${key}` };
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
let count = 0;
for (const file of walk(src)) {
  const rel = relative(src, file).split(/[\\/]/);
  const bucket = rel.shift();
  const path = rel.join('/');
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { ...h, 'x-upsert': 'true', 'Content-Type': 'application/octet-stream' },
    body: readFileSync(file),
  });
  console.log(`${res.ok ? 'OK  ' : 'FAIL'} ${bucket}/${path}${res.ok ? '' : ' -> ' + (await res.text())}`);
  if (res.ok) count++;
}
console.log(`uploaded: ${count}`);