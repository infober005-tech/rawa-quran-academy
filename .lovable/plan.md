# Implementation Plan

## 1. Live Halaqa Infrastructure (Google Meet + extensible)

### Important constraint up front
True "auto-generate Google Meet links" requires Google Calendar API + OAuth (each meeting created as a calendar event). The pragmatic, reliable approach:

- **Schema supports auto-generation later**, but the MVP uses **manual link entry by the Director** (paste a `meet.google.com/xxx-xxx-xxx` link, or use `https://meet.google.com/new` and paste the result). This is how 90% of small academies actually operate and avoids OAuth complexity.
- Architecture is **provider-agnostic** (`meeting_provider` enum: `google_meet`, `zoom`, `jitsi`, `other`) so Zoom plugs in later by adding a row to the enum + a `meeting_id`/`passcode` field.
- If you later want true auto-generation, we'll add the Google Calendar connector and an edge function that creates a Calendar event with `conferenceDataVersion=1` per session.

### Schema changes
- Convert `meeting_provider` text column to enum `meeting_provider_type`.
- Add columns: `meeting_id` (text), `meeting_passcode` (text), `live_session_active` (bool, default false), `live_session_started_at`, `live_session_started_by`.
- New table `halaqa_sessions` (scheduled or ad-hoc live sessions): `id, halaqa_id, scheduled_at, started_at, ended_at, started_by, meeting_url_override, notes`. RLS: students/teachers/supervisors of the halaqa can read; teacher + supervisor can start/end.

### UI
- **Director Halaqa form**: provider dropdown (Google Meet / Zoom (coming soon, disabled) / Other), meeting URL field with validator, "Open meet.google.com/new" helper button.
- **Teacher dashboard**: "Start session" button → marks `live_session_active=true`, inserts a `halaqa_sessions` row, opens meeting URL in new tab.
- **Student dashboard**: "Join live" button (enabled only when `live_session_active=true`), opens URL.
- **Supervisor dashboard**: Read-only session monitor + "End session" override.
- **Upcoming sessions widget**: shown in Student/Teacher/Supervisor dashboards using `schedule_days` + `start_time` to compute next 7 days.

---

## 2. Parent Portal

### Schema changes
- Add `parent` to `app_role` enum.
- Update permissions matrix (`src/lib/permissions.ts`) with PARENT role: read-only on linked student's halaqa, attendance, evaluations, supervisor_notes; can register for events; can read notifications.
- Update RLS policies on `attendance`, `evaluations`, `supervisor_notes`, `student_halaqas` to allow parents to read rows where the student is in their `parent_links`. Add SECURITY DEFINER helper `public.is_parent_of(_parent_id uuid, _student_id uuid)` to keep policies simple and recursion-free.
- Director admin panel: new "Parent Links" tab to create/remove parent↔student links and assign the parent role.

### UI
- New `ParentDashboard.tsx` with tabs per linked child: Attendance, Evaluations, Memorization progress, Upcoming halaqas, Teacher notes.
- Routing: `_authenticated/dashboard.tsx` already switches on `primaryRole` — add `parent` case.
- Parent registration: parents are created by the Director (not self-signup) to prevent abuse; Director sets email + initial password + links student.

---

## 3. Email Notifications

Use **Lovable Emails** (built-in, production-ready, no extra API key, full bounce/suppression handling).

### Setup sequence
1. Check email domain status → if none, show setup dialog and wait.
2. `setup_email_infra` → queues + tables + cron.
3. `scaffold_auth_email_templates` → branded password reset, confirmation, magic link, etc.
4. `scaffold_transactional_email` → branded app email infrastructure.

### Templates to create (`src/lib/email-templates/`)
- `student-approval.tsx` — sent when Director approves a student
- `halaqa-assignment.tsx` — sent when student is added to a halaqa
- `event-published.tsx` — sent when event is published (per registered user)
- `attendance-alert.tsx` — sent to parent when child is absent
- `evaluation-report.tsx` — sent to student + parent after evaluation
- Auth password-reset is handled by `scaffold_auth_email_templates` (branded)

### Trigger wiring
- Replace the SQL `notify_*` triggers with edge-friendly enqueue calls, OR keep in-app notifications AND add server-side hooks in the relevant `createServerFn` mutations that also call `sendTransactionalEmail({...})`.
- Recipients pulled from `profiles.email` (student) + linked parent emails via `parent_links`.

---

## What I'll need from you
1. **Confirm the manual-link approach for Google Meet** (vs spending more on Calendar OAuth).
2. **Confirm parents are created by Director** (no self-signup).
3. If you have a domain you want for emails (e.g. `notify.rawa-academy.com`), have it ready — otherwise the Lovable setup dialog will guide you.

---

## Execution order
1. Migration: meeting_provider enum + halaqa_sessions + parent role + is_parent_of() + RLS updates.
2. Update `permissions.ts`, `use-auth.tsx`, dashboard router.
3. Build `ParentDashboard.tsx` + Director "Parent Links" admin panel.
4. Build Live session UI in Director form / Teacher / Student / Supervisor dashboards.
5. Email domain setup → infra → auth templates → transactional templates.
6. Wire email triggers into the relevant server flows.

Reply "go" (or with your answers to the 3 questions above) and I'll execute end-to-end.