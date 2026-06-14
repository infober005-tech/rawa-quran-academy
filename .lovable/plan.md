## Rawa Premium Algerian Payment System

Build a complete, paid-only subscription system using CCP / Edahabia / BaridiMob — no card processor, no Stripe. Director configures price + CCP details, students upload receipts, Director approves, subscription unlocks the platform.

---

### 1. Database (one migration)

**`payment_settings`** (singleton row, Director-editable)
- `subscription_name_ar/fr/en`, `description_ar/fr/en`, `price_dzd numeric`, `currency` (default `DZD`)
- `ccp_number`, `ccp_key`, `account_holder`, `rip_number` (optional)
- `qr_code_url` (storage), `subscription_duration_days` (default 30)
- `benefits_ar/fr/en jsonb`

**`payments`**
- `id`, `student_id → auth.users`, `full_name`, `email`, `phone`
- `amount numeric`, `transaction_number`, `payment_date date`
- `receipt_file_url`, `status` enum `payment_status` (`pending`, `approved`, `rejected`)
- `admin_notes`, `reviewed_by`, `created_at`, `approved_at`, `rejected_at`

**`subscriptions`**
- `id`, `student_id`, `payment_id`, `status` enum `subscription_status` (`pending`, `active`, `expired`, `rejected`, `cancelled`)
- `start_date`, `end_date`, timestamps
- Unique index ensuring one active subscription per student

**Helpers**
- `public.has_active_subscription(_user_id uuid) returns boolean` — SECURITY DEFINER, checks `subscriptions` where `status='active' AND end_date >= now()`.
- Trigger `on payments AFTER UPDATE`: when `status` changes to `approved`, create/extend `subscriptions` row (start = greatest(now(), current end_date), end = start + duration), insert notification. When `rejected`, insert rejection notification. When `pending` INSERT, notify all Directors.

**RLS**
- `payment_settings`: SELECT for authenticated, INSERT/UPDATE only `director`.
- `payments`: student SELECT/INSERT own (`student_id = auth.uid()`); director SELECT/UPDATE all.
- `subscriptions`: student SELECT own + parent via `is_parent_of`; director ALL.
- GRANTs on all three to `authenticated` + `service_role`.

**Storage**
- New private bucket `payment-receipts` (RLS: student writes own folder `{uid}/...`, director reads all).
- Reuse existing storage pattern for `qr_code_url` under `halaqa-files` or new public `payment-assets` bucket for QR.

---

### 2. Routes & UI

**`/subscribe`** (authenticated, accessible regardless of active subscription)
- Premium landing-style payment page (purple/gold glassmorphism, framer-motion).
- Header with Rawa logo, "إتمام الاشتراك".
- **Plan card**: name, price (large, gold), benefits list.
- **CCP card**: CCP number, holder, with Copy buttons + "Copy All" → sonner toast "تم نسخ المعلومات بنجاح".
- **QR Code**: render via `qrcode` npm (generated client-side from settings string), large, gold-bordered.
- **Instructions timeline** (5 steps, animated).
- **Upload form** (react-hook-form + zod): full_name, email, phone, transaction_number, amount, payment_date, file dropzone (JPG/PNG/PDF, max 5MB, progress, preview, replace/delete). Submits → uploads file to `payment-receipts/{uid}/{uuid}.{ext}` → inserts `payments` row (status=pending) → routes to success view.
- **Status tracker** (when student has a payment): 4-step timeline (pending/approved variants), color-coded.
- **Sticky mobile bottom bar**: price + CCP + copy + QR-modal button.

**`/subscribe/success`** view (inline section after submit).

**Access control**
- Add `<SubscriptionGate>` wrapper in `src/components/SubscriptionGate.tsx`. Used inside `_authenticated/halaqas.tsx`, `events.tsx`, evaluations and live-session entry points. Directors/Teachers/Supervisors/Parents are exempt — only `student` role is gated.
- If student lacks active subscription, render premium "Subscribe to access" CTA → `/subscribe`. Dashboard stays accessible (so they can see their payment status).

**Student Dashboard**
- Add `SubscriptionPanel` showing status badge, start/end dates, days remaining (computed), payment history list, "Upload new receipt / Renew" CTA.

**Director Dashboard / Admin**
- New `PaymentsPanel.tsx` tab in `/admin`:
  - Tabs: Pending / Approved / Rejected.
  - Table: student, amount, date, transaction #, receipt thumbnail.
  - Row actions: View (modal with zoomable image / PDF iframe), Download, Approve, Reject (with required admin_notes).
  - Filters: date range, status, student search.
- New `PaymentSettingsPanel.tsx`: edit price, CCP info, holder, duration, benefits, upload QR image.

**Notifications** — reuse existing `notifications` table via the trigger above. (Email integration is out of scope for this turn; in-app only.)

---

### 3. Files

**Create**
- `supabase/migrations/<ts>_payments.sql`
- `src/routes/_authenticated/subscribe.tsx`
- `src/features/subscription/PaymentPage.tsx`
- `src/features/subscription/ReceiptUpload.tsx`
- `src/features/subscription/StatusTracker.tsx`
- `src/features/subscription/SubscriptionPanel.tsx` (student dashboard)
- `src/components/SubscriptionGate.tsx`
- `src/features/admin/PaymentsPanel.tsx`
- `src/features/admin/PaymentSettingsPanel.tsx`
- `src/hooks/use-subscription.tsx`

**Edit**
- `src/routes/_authenticated/admin.tsx` — add tabs.
- `src/routes/_authenticated/dashboard.tsx` / `StudentDashboard.tsx` — embed `SubscriptionPanel`.
- `src/routes/_authenticated/halaqas.tsx`, `events.tsx` — wrap with `SubscriptionGate`.
- `src/lib/i18n.tsx` — add AR/FR/EN keys for subscription.
- `src/lib/permissions.ts` — add `manage_payments` for director.

**Install**
- `qrcode`, `@types/qrcode`, `react-dropzone`

---

### Out of scope for this PR
- Email notifications (already pending domain setup).
- Auto-expiry cron (will mark `expired` via a daily edge cron in a follow-up; for now `has_active_subscription` uses `end_date >= now()` so expiry is effectively automatic at read time).
- Refunds / cancellations UI.

Confirm and I'll ship it.
