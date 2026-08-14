# إعدادات المصادقة والبيانات غير القابلة للنسخ عبر SQL
لقطة بتاريخ 2026-08-14 (قراءة فقط).

## مزودو المصادقة المفعّلون
| المزود | الحالة |
| --- | --- |
| Email + Password | مفعّل |
| Google OAuth | مفعّل |
| Phone / SMS | غير مفعّل |
| Anonymous sign-in | غير مفعّل |
| SAML SSO | غير مفعّل |
| Passkeys | غير مفعّل |
| كل المزودين الآخرين (Apple, GitHub, Facebook…) | غير مفعّل |

## إعدادات مهمة
- `disable_signup = false` — التسجيل العام مفتوح.
- `mailer_autoconfirm = false` — **تأكيد البريد مطلوب** قبل الدخول.
- `phone_autoconfirm = false`.
- Redirect URLs المستخدمة في الكود: `window.location.origin` و `${origin}/auth/callback` و `${origin}/reset-password`.
  في المشروع الجديد أضف: عنوان المعاينة، العنوان المنشور، وأي دومين مخصص.
- قوالب البريد (تأكيد / استعادة كلمة المرور) تُضبط يدوياً في المشروع الجديد.

## auth.users — ما نُسخ وما لا يمكن نسخه
تم تصدير **بيانات وصفية فقط** إلى:
- `data/_auth_users_metadata.json`
- `data/_auth_users_metadata.csv`

الحقول المصدَّرة: `id`, `email`, `phone`, `email_confirmed_at`, `created_at`, `last_sign_in_at`, `providers`, `user_metadata`.

**لم يُصدَّر إطلاقاً (ولا يمكن):** `encrypted_password`، رموز التأكيد/الاستعادة، refresh tokens، جلسات، عوامل MFA، أي secret أو service-role key.

### طريقة الاستعادة
1. أنشئ المستخدمين في المشروع الجديد عبر Admin API مع **نفس `id`** للحفاظ على كل الـ Foreign Keys:
   `POST /auth/v1/admin/users` مع `{ id, email, email_confirm: true, user_metadata }`.
2. لا تُنشئ كلمات مرور: أرسل رابط "إعادة تعيين كلمة المرور" لكل مستخدم، أو دعه يسجّل الدخول بـ Google.
3. عطّل مؤقتاً trigger `on_auth_user_created` قبل الإنشاء الجماعي، أو أنشئ المستخدمين أولاً ثم استورد `profiles` و `user_roles` بعد حذف الصفوف التي أنشأها الـ trigger.
