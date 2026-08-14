# Rawa Quran Academy — Database Backup (Schema)

## الملفات
- `20260814_full_schema_snapshot.sql` — لقطة كاملة وقابلة للتشغيل لبنية قاعدة البيانات (تاريخ 2026-08-14).
- `generate_schema_snapshot.sh` — السكربت الذي يولّد اللقطة (يمكن إعادة تشغيله لاحقاً لتحديث النسخة).
- `../migrations/` — 34 ملف migration تاريخي (سجل التغييرات الأصلي، محفوظ كما هو).

## ما تم حفظه في اللقطة
| القسم | العدد |
| --- | --- |
| Schemas (`public`, `private`) | 2 |
| Enum types | 12 |
| Tables | 25 |
| Constraints (PK / UNIQUE / CHECK / FK) | 92 |
| Indexes (غير مرتبطة بقيود) | 24 |
| Functions (بما فيها SECURITY DEFINER) | 26 |
| Triggers على `public` | 22 |
| Views / Materialized views | 0 (لا توجد) |
| GRANTs لـ anon / authenticated / service_role | 71 |
| ENABLE ROW LEVEL SECURITY | 25 |
| RLS policies (public + private + storage.objects) | 129 |
| Storage buckets | 7 |
| Realtime publication (كتعليقات مرجعية) | ✔ |
| عدد صفوف كل جدول وقت النسخ (كتعليقات مرجعية) | ✔ |

## ما لم يُحفظ (ولا يمكن/لا ينبغي حفظه هنا)
- **البيانات الفعلية (الصفوف)** — اللقطة بنيوية فقط. لتصدير البيانات استخدم Cloud → Advanced settings → Export data.
- **مستخدمو `auth.users` وكلمات المرور** — يديرها نظام المصادقة ولا يمكن نسخها عبر SQL.
- **ملفات Storage الفعلية** — تُحفظ سياسات ودلاء التخزين فقط، لا محتوى الملفات.
- **الـ Secrets ومفاتيح API** — تُضبط يدوياً في المشروع الجديد.
- **إعدادات Auth** (المزودون، القوالب، الروابط) — تُعاد ضبطها في المشروع الجديد.
- **Trigger على `auth.users`** (`on_auth_user_created`) — محفوظ كتعليق في نهاية قسم Triggers؛ يجب إعادة إنشائه يدوياً عبر migration في المشروع الجديد.

## طريقة الاسترجاع في مشروع Lovable آخر
1. أنشئ مشروعاً جديداً وفعّل Cloud.
2. شغّل محتوى `20260814_full_schema_snapshot.sql` كـ migration واحدة (بالترتيب كما هو).
3. أعد إنشاء trigger `on_auth_user_created` على `auth.users` ليشير إلى `public.handle_new_user()`.
4. أعد إضافة الجداول إلى publication الـ realtime حسب التعليقات في نهاية الملف.
5. أعد ضبط مزودي المصادقة والـ secrets.
6. استورد البيانات (إن رغبت) من ملفات CSV مُصدّرة.

> لم يتم تعديل أو حذف أي بيانات، ولا أي RLS أو صلاحيات أو Auth أو Storage أثناء إنشاء هذه النسخة — العمليات كانت قراءة فقط.