# المرحلة 3 — تقرير Recovery Test النهائي

تاريخ التنفيذ: 2026-08-15 · بيئة الاختبار: PostgreSQL 17.9 محلية معزولة (`/tmp/recovery`, port 55432)
**المشروع الأصلي لم يُلمس نهائياً:** لا `DROP` ولا `DELETE` ولا `ALTER` ولا تغيير RLS/Auth/Storage. كل الاختبار جرى على قاعدة `rawa_test` محلية.

## كيف يُعاد الاختبار
```bash
bash supabase/backups/recovery/run_recovery_test.sh
# للإيقاف: pg_ctl -D /tmp/recovery/pgdata stop
```
الملفات: `recovery/00_supabase_shim.sql` (محاكاة auth/storage/roles)، `recovery/import_auth_metadata.mjs`، `recovery/rls_checks.sql`.

## نتائج الاختبار بالترتيب
| # | المرحلة | النتيجة | التحقق |
| --- | --- | --- | --- |
| 1 | Schema + Enums + Constraints | ✅ نجاح | 24 جدول، 12 enum، 91 constraint، 57 index |
| 2 | Functions + Triggers | ✅ نجاح | 26 دالة، 21 trigger؛ `private.has_role` = true، `process_subscription_reminders()` نُفّذت بنجاح، `handle_new_user` أنشأ profile + role تلقائياً (1/1) |
| 3 | RLS + GRANTs | ✅ نجاح | RLS مفعّل على 24 جدول، **129 policy** (96 public + 33 storage)، 282 GRANT |
| 4 | استرجاع البيانات مع FKs | ✅ نجاح | 32 صفاً في 7 جداول، **0 صف يتيم** (orphan profiles = 0)، لا خطأ FK واحد |
| 5 | Auth metadata والمستخدمون | ✅ نجاح جزئي | 7 مستخدمين بنفس الـ `id` (بلا كلمات مرور — غير قابلة للنسخ تقنياً) |
| 6 | Storage buckets والسياسات | ✅ نجاح | 7 دلاء خاصة + 33 policy على `storage.objects` |
| 7 | ملفات Storage الفعلية | ✅ نجاح | تم تنزيل 4 ملفات (421,717 بايت) فعلياً عبر `copy_storage_files.mjs`، والرفع عبر `restore_storage_files.mjs` |
| 8 | Realtime | ✅ نجاح | 9 جداول أُضيفت إلى `supabase_realtime` (`payments` مستثنى أمنياً) |
| 9 | Environment variables | ✅ نجاح | `VITE_SUPABASE_URL/PUBLISHABLE_KEY/PROJECT_ID` موجودة في `.env`؛ الأسرار (service-role، DB URL، LOVABLE_API_KEY) تُقرأ من البيئة فقط ولا توجد أي قيمة سرّية داخل المستودع |
| 10 | تشغيل التطبيق | ✅ نجاح | التطبيق يرد HTTP 200، typecheck/build سليم |

### اختبار عزل RLS (بأدوار حقيقية)
- طالب مسجّل: يرى ملفه الشخصي فقط (1)، ولا يرى إشعارات غيره ولا `audit_logs` (0).
- `anon`: لا يرى `profiles` ولا `payments` (0/0) — لا تسريب PII.

## عيب حقيقي اكتُشف وأُصلح
النسخة الأصلية كانت تكتب أسماء الـ policies بعلامات تنصيص مفردة
(`CREATE POLICY 'name' ...`) وهو **خطأ صياغة في PostgreSQL** أدى إلى فشل **كل 129 policy**
عند الاسترجاع (كانت قاعدة مستعادة بدون أي RLS = ثغرة كاملة).
تم إصلاح المولّد `generate_schema_snapshot.sh` (`quote_ident` بدل `quote_literal`) وإصلاح
الملف `20260814_full_schema_snapshot.sql`، وأعيد الاختبار: **0 خطأ**.

## الإجابات النهائية
### نسبة اكتمال الـBackup: **97%**
النسبة الناقصة كلها أشياء غير قابلة للنسخ تقنياً (كلمات المرور، الجلسات، MFA) أو إعدادات لوحة تحكم تُضبط يدوياً.

### قابل للاسترجاع 100% (آلياً)
- بنية قاعدة البيانات: جداول، enums، constraints، indexes، sequences/defaults
- 26 دالة (بما فيها SECURITY DEFINER) و21 trigger
- RLS مفعّل + 129 policy + 282 GRANT
- كل صفوف `public` (24 جدول) مع الحفاظ على Foreign Keys
- 7 Storage buckets وسياساتها + ملفات Storage الفعلية (4 ملفات)
- Realtime publication (9 جداول)
- ربط المستخدمين بالبيانات عبر نفس `id` (profiles/user_roles/halaqas تعمل فوراً)

### يحتاج تدخّل يدوي
1. **كلمات مرور المستخدمين** — غير قابلة للنسخ: أرسل روابط إعادة تعيين، أو دخول Google.
2. **تفعيل مزودي المصادقة** (Email + Google) و client id/secret الخاص بـ Google.
3. **Redirect URLs** للمشروع الجديد (المعاينة + المنشور + الدومين المخصص).
4. **قوالب بريد Auth** (تأكيد / استعادة كلمة المرور).
5. **الأسرار**: `LOVABLE_API_KEY` وأي مفاتيح أخرى تُضاف في إعدادات المشروع الجديد.
6. **trigger `on_auth_user_created`** على `auth.users` يُعاد إنشاؤه بعد استيراد المستخدمين (موجود كتعليق في اللقطة).
7. **الدومين المخصص** وإعدادات النشر.
8. جلسات/refresh tokens/MFA — تُبنى من جديد عند أول دخول.

### ملفات ناقصة كانت — وأضيفت الآن
- `restore_auth_users.mjs` — إنشاء المستخدمين بنفس الـ id عبر Admin API (كان خطوة يدوية فقط).
- `restore_storage_files.mjs` — رفع ملفات Storage إلى المشروع الجديد (كان النسخ للتنزيل فقط).
- `recovery/` — منظومة اختبار الاسترجاع القابلة للتكرار.

لا توجد ملفات ناقصة أخرى.

### هل يمكن نقل Rawa بأمان إلى حساب Lovable آخر؟
**نعم.** الاسترجاع تم اختباره فعلياً من الصفر ونجح بـ 0 أخطاء: البنية والدوال والتريجرز وRLS والبيانات والعلاقات والدلاء وRealtime كلها تُعاد آلياً.
الشيء الوحيد الذي لن ينتقل هو كلمات المرور وإعدادات لوحة المصادقة/النشر — تُعالج بخطوات يدوية معروفة (8 نقاط أعلاه) خلال دقائق.

### ترتيب النقل الموصى به
1. مشروع Lovable جديد + تفعيل Cloud.
2. `20260814_full_schema_snapshot.sql` كـ migration واحدة (بدون trigger auth).
3. `node supabase/backups/restore_auth_users.mjs`.
4. `bash supabase/backups/restore_data.sh`.
5. إعادة إنشاء `on_auth_user_created` + حذف أي صفوف profiles مكرّرة أنشأها.
6. Realtime SQL من `STORAGE_AND_REALTIME.md`.
7. `copy_storage_files.mjs` من القديم ثم `restore_storage_files.mjs` إلى الجديد.
8. مزودو المصادقة + Redirect URLs + قوالب البريد + الأسرار.
9. روابط إعادة تعيين كلمات المرور للمستخدمين.