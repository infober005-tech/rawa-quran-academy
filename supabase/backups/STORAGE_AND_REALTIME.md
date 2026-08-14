# Storage و Realtime — لقطة 2026-08-14 (قراءة فقط)

## Buckets (7) — كلها خاصة (private)
| Bucket | public | حد الحجم | أنواع مسموحة |
| --- | --- | --- | --- |
| assignments | لا | افتراضي | الكل |
| documents | لا | افتراضي | الكل |
| halaqa-files | لا | افتراضي | الكل |
| payment-receipts | لا | افتراضي | الكل |
| quran-audio | لا | افتراضي | الكل |
| recordings | لا | افتراضي | الكل |
| student-submissions | لا | افتراضي | الكل |

سياسات `storage.objects` (INSERT/SELECT/UPDATE/DELETE لكل bucket) محفوظة كاملة داخل
`20260814_full_schema_snapshot.sql` في قسم *STORAGE POLICIES*، ودلاء التخزين في قسم *STORAGE BUCKETS*.

## جرد الملفات الفعلية
`data/_storage_objects_inventory.csv` — 4 ملفات، كلها في `payment-receipts` (≈ 421 KB إجمالاً)
مع المسار والمالك والتواريخ والـ mimetype والحجم. **محتوى الملفات نفسه غير محفوظ في المستودع.**

### نسخ الملفات الفعلية لاحقاً (آمن)
```bash
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<من إعدادات المشروع، لا يُخزَّن في Git>"
node supabase/backups/copy_storage_files.mjs ./storage-files
```
السكربت يقرأ فقط (list + download) ويحفظ الملفات محلياً بنفس شجرة `bucket/path`.
لا ترفع مجلد `storage-files/` إلى GitHub.

## Realtime publication `supabase_realtime`
الجداول المضافة (9):
`attendance`, `attendance_sessions`, `conversations`, `conversation_members`,
`evaluations`, `halaqa_sessions`, `messages`, `session_recordings`, `subscriptions`

للاستعادة في المشروع الجديد:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance, public.attendance_sessions,
  public.conversations, public.conversation_members, public.evaluations,
  public.halaqa_sessions, public.messages, public.session_recordings, public.subscriptions;
```
ملاحظة أمنية: `public.payments` **مستثنى عن قصد** (يحتوي PII) — لا تُعده.
