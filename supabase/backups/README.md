# Rawa Quran Academy — نسخة احتياطية كاملة لقاعدة البيانات

آخر تحديث: 2026-08-14 — كل العمليات كانت **قراءة فقط**: لم يُعدّل أو يُحذف أي صف، ولم تُغيَّر أي RLS أو Auth أو Storage.

## الملفات

### المرحلة 1 — البنية (Schema)
- `20260814_full_schema_snapshot.sql` — لقطة كاملة قابلة للتشغيل: 2 schemas، 12 enum، 24 جدول، 91 constraint، 23 index، 26 function، 21 trigger، 71 GRANT، 24 ENABLE RLS، 129 RLS policy، 7 storage buckets.
- `generate_schema_snapshot.sh` — السكربت المولِّد للبنية.
- `../migrations/` — سجل الـ migrations التاريخي كما هو.

### المرحلة 2 — البيانات والإعدادات
- `data/*.csv` — بيانات كل جداول `public` (CSV مع رؤوس أعمدة).
- `data/_manifest.tsv` — جدول بعدد الصفوف وحجم كل ملف.
- `data/_auth_users_metadata.json` / `.csv` — بيانات حسابات المصادقة الوصفية (بدون كلمات مرور).
- `data/_storage_objects_inventory.csv` — جرد ملفات Storage (مسار، مالك، حجم، نوع).
- `generate_data_snapshot.sh` — يعيد توليد نسخة البيانات (قراءة فقط).
- `export_auth_users.mjs` — يصدّر بيانات الحسابات الوصفية (يقرأ المفتاح من البيئة).
- `restore_data.sh` — يستورد ملفات CSV إلى مشروع جديد بالترتيب الصحيح للعلاقات.
- `copy_storage_files.mjs` — تنزيل ملفات Storage الفعلية لاحقاً.
- `AUTH_AND_SETTINGS.md` — إعدادات Auth الحالية وطريقة استعادة المستخدمين.
- `STORAGE_AND_REALTIME.md` — الدلاء والسياسات وجرد الملفات وRealtime publication.

## ما تم نسخه
- بنية قاعدة البيانات بالكامل + RLS + الصلاحيات + الدوال والتريجرز.
- **كل صفوف جداول `public`** (24 جدول) بصيغة CSV بترتيب يحافظ على Foreign Keys.
- بيانات حسابات المصادقة الوصفية (7 مستخدمين) مع `id` الأصلي للحفاظ على العلاقات.
- إعدادات المصادقة المفعّلة (Email، Google، تأكيد البريد، redirect URLs).
- قائمة Storage buckets وسياساتها + جرد الملفات (4 ملفات).
- Realtime publication (9 جداول).

## ما لم يتم نسخه (ولا ينبغي)
- **كلمات المرور** (`encrypted_password`) والرموز والجلسات و MFA — غير قابلة للنسخ.
- **أي secret أو service-role key** — لا يوجد أي مفتاح داخل هذا المستودع؛ السكربتات تقرأ من متغيرات البيئة.
- **محتوى ملفات Storage الفعلي** — يُنزَّل عند الحاجة عبر `copy_storage_files.mjs`.
- قوالب بريد Auth والدومينات المخصصة — تُضبط يدوياً.

## ترتيب تنفيذ الاسترجاع في مشروع Lovable/Supabase جديد
1. أنشئ المشروع الجديد وفعّل Cloud.
2. نفّذ `20260814_full_schema_snapshot.sql` كـ migration واحدة (البنية + RLS + GRANTs + الدوال + التريجرز + الدلاء).
3. **عطّل مؤقتاً** trigger `on_auth_user_created` (أو أنشئه لاحقاً فقط) لتجنّب صفوف `profiles` مكرّرة.
4. أنشئ مستخدمي المصادقة عبر Admin API بنفس `id` من `data/_auth_users_metadata.json` (انظر `AUTH_AND_SETTINGS.md`).
5. شغّل `bash supabase/backups/restore_data.sh` لاستيراد بيانات `public` بالترتيب.
6. أعِد إنشاء trigger `on_auth_user_created` على `auth.users` ليشير إلى `public.handle_new_user()`.
7. أعد إضافة جداول Realtime (SQL موجود في `STORAGE_AND_REALTIME.md`).
8. اضبط مزودي المصادقة (Email + Google)، redirect URLs، وقوالب البريد.
9. أعد إضافة الـ secrets (مثل `LOVABLE_API_KEY`) في إعدادات المشروع الجديد.
10. نزّل ملفات Storage من المشروع القديم وارفعها إلى الجديد بنفس المسارات.
11. أرسل روابط إعادة تعيين كلمة المرور للمستخدمين (أو دعهم يستخدمون Google).
