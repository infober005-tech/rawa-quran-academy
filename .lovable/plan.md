## Scope

Two large tracks in one turn: (A) Halaqa Management upgrade and (B) platform-wide mobile-first sweep. To keep quality high and avoid a mega-diff that regresses production, I want to confirm the approach and sequencing before writing code.

---

## Track A — Halaqa Management upgrade

Touches: `src/features/admin/HalaqasPanel.tsx`, `src/routes/_authenticated/halaqas.tsx`, dashboards that render halaqa titles, i18n dictionaries, and the DB.

### Schema (additive only — no RLS, auth, or business-logic changes)

New optional columns on `halaqas`:
- `halaqa_date` `date` (nullable — required only at the form layer)
- `halaqa_day` `smallint` 0..6 (auto-derived, stored for filtering)

Note: "halaqa_name" — the table already has `name`. I will keep the existing `name` column (renaming would break every consumer, notifications, evaluations, attendance joins, RLS-referencing views). The UI label becomes "اسم الحلقة *"; DB stays `name`. This is the only deviation from the spec — call out if you want a hard rename instead (higher risk, requires trigger/notification refactor).

### Form (Director-only, `HalaqasPanel`)

- 3-col desktop / 2-col tablet / 1-col mobile grid.
- Fields with required validation: name, teacher, gender, level, max_students, halaqa_date (date picker → auto-fills day chip), start_time, end_time, meeting_link, status, ≥1 weekday, ≥1 student.
- Searchable multi-select for students, grouped by level (beginner / intermediate / advanced) with Select All / Clear / count.
- Segmented Draft / Published buttons (values `draft` / `published`). Note current DB enum is `active | archived | inactive` — I'll add `draft` and `published` to the check/enum and treat `active` as legacy-published for read paths so old rows keep working.
- Draft rule enforced in UI (hides meeting link + suppresses toast). Real notification suppression is already handled by the existing trigger `notify_halaqa_activated` (fires only when status transitions to `active`); I'll extend it to also fire on `published`.

### List / cards

Redesigned card shows: name, teacher, students count, level, day, formatted date (`29 يونيو 2026` via `Intl.DateTimeFormat` with current locale), start–end time, status badge, meet icon.

### Filters bar

Name search, teacher, level, day, status (draft/published/all), date range.

### Display everywhere

Halaqa name is already used in `TeacherDashboard`, `StudentDashboard`, `DirectorDashboard`, `ParentDashboard`, notifications, attendance, evaluations — I'll audit each and ensure the new name/date/day render consistently.

---

## Track B — Mobile-first sweep

Existing plan file `.lovable/plan.md` already covers this in detail. I'll execute it in one batch:

1. Add `ResponsiveDialog`, `ResponsiveTable`, `StatGrid`, `PageShell` primitives.
2. Convert every admin panel table (`Users`, `Halaqas`, `Events`, `Payments`, `ParentLinks`, `PaymentSettings`, `Calendar`) to `ResponsiveTable` — desktop table, mobile glass card list with title / badge / meta / date / actions.
3. Swap every `Dialog`/`AlertDialog` to `ResponsiveDialog` (Vaul drawer under 768px).
4. Page-by-page pass on Landing, Auth, Reset, all 6 dashboards, Halaqas, Events, Notifications, Settings, Subscribe, Payment Status, Profile — single column < 768, safe-area, sticky headers, full-width CTAs.
5. Forms: 48px inputs on mobile, correct `inputMode`, single-column.
6. Charts wrapped in `ResponsiveContainer`, images lazy + aspect-ratio.
7. Global CSS: verify `overflow-x: hidden`, `clamp()` typography, `.stack-actions`, safe-area helpers.

### Desktop invariance

All mobile changes are `md:`-gated. Desktop dashboards, sidebar, tables, dialogs render identically to today.

### QA

Playwright sweep at 320 / 360 / 375 / 390 / 414 / 768 / 1024 / 1440, screenshots under `/tmp/browser/qa/`, checked for no horizontal overflow, no clipped text, dialogs full-screen on mobile, tables → cards on mobile. Typecheck + build must pass.

---

## Out of scope (unchanged)

- Auth, RBAC, RLS, subscriptions, payments logic.
- Visual language / color tokens.
- Any new features beyond the two tracks above.

---

## Confirmations I need before starting

1. **Halaqa DB column**: keep existing `name` and only relabel in UI (safe), or hard-rename `name → halaqa_name` platform-wide (risky, touches triggers + notifications + every consumer)?
2. **Status enum**: add `draft` and `published` alongside existing `active | archived | inactive`, or fully migrate old rows to the new values (data migration required)?
3. **Order**: ship Track A (Halaqa) first in one turn, then Track B (mobile sweep) in the next — or one combined mega-turn? I recommend splitting; the mobile sweep alone touches ~40 files.

Approve and I'll start with Track A using option 1 (label-only) + option 2 (additive enum) unless you say otherwise.