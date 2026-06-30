## Phase 2 — Mobile-First UI Overhaul

Pure UI/UX work. Database, auth, RBAC, RLS, payments, subscriptions and all business logic stay untouched. I'll only edit presentation code (components, styles, route view layers).

### 1. Foundation primitives (shared, used everywhere)

Create reusable presentation helpers so the rest of the work is a small, repeatable substitution rather than dozens of bespoke rewrites:

- `src/components/ui/responsive-dialog.tsx` — wraps shadcn `Dialog` on `md+` and Vaul `Drawer` (full-screen sheet) under 768px. Drop-in replacement for existing `Dialog`/`DialogContent` usages.
- `src/components/ui/data-cards.tsx` — `<ResponsiveTable>` wrapper: renders `<Table>` on `md+`, maps rows to glass `Card`s on mobile (title, status badge, meta, date, actions).
- `src/components/ui/stat-grid.tsx` — `1 / 2 / 4–5` column grid utility for dashboard stat cards.
- `src/components/ui/page-shell.tsx` — sticky mobile header, safe-area padding (`pb-[env(safe-area-inset-bottom)]`), single-column on mobile.
- `src/styles.css` — add fluid typography utilities (`clamp()` for h1–h4, body), `.glass-gold-card` token (already partially there), `min-h-12` touch target class, container max-widths.

### 2. Tables → Mobile cards

Replace direct `<Table>` usage with `<ResponsiveTable columns={…} rows={…} renderCard={…} />` in:

- `features/admin/UsersPanel`, `HalaqasPanel`, `EventsPanel`, `PaymentsPanel`, `ParentLinksPanel`, `PaymentSettingsPanel`, `CalendarPanel`
- `features/dashboards/*` (Director, GS, Teacher, Supervisor, Parent, Student) wherever lists/tables appear
- `features/subscription/*` history/status lists
- `features/recordings/RecordingsPanel`, `features/insights/AIInsightsPanel`

Each mobile card: glass background, gold border, rounded-2xl, shadow-soft, title + status badge + 2–3 meta rows + date + action buttons (full-width on mobile).

### 3. Full-screen mobile dialogs

Swap `Dialog` → `ResponsiveDialog` in:
- Payment dialog, QR preview, Receipt preview/upload
- Student details, Edit profile
- Event editor, Halaqa editor, Session capture modal
- All confirmation/alert dialogs
- Notifications panel (drawer on mobile)

### 4. Page-by-page passes

For each page below, apply: single column < 768px, full-width cards/buttons, fluid typography, safe-area padding, sticky header. No business logic touched.

- `routes/index.tsx` (Landing) — stack hero, collapse columns, scale 3D logo, vertical CTA stack
- `routes/auth.tsx` (Login + Register tabs) — single column, 48px inputs, numeric/email keyboards, RTL preserved
- `routes/reset-password.tsx`
- `routes/_authenticated/dashboard.tsx` (router only — verifies all 6 dashboards via responsive stat-grid)
- `routes/_authenticated/{halaqas,events,notifications,settings,subscribe,payment-status,admin}.tsx`
- `features/dashboards/{Student,Parent,Teacher,Director,GeneralSupervisor,Supervisor}Dashboard.tsx`
- `features/subscription/{PaymentPage,ReceiptUpload,StatusTracker,SubscriptionPanel}.tsx` — responsive QR (320/260/220), stacked buttons on mobile
- Profile area (currently inside settings)

### 5. Forms

`Input` already has `h-11` (44px). Bump to `h-12` (48px) on mobile via responsive class. Add `inputMode="numeric"` / `inputMode="email"` where appropriate in auth, registration, payment forms. Single-column grids on `<md`.

### 6. Charts & images

- Wrap Recharts with `ResponsiveContainer` (verify across dashboards).
- All `<img>` get `loading="lazy"`, `object-cover`, explicit aspect ratios via `aspect-*`.
- Lazy load heavy panels (`PaymentsPanel`, `AIInsightsPanel`, `RecordingsPanel`) via `React.lazy` if not already.

### 7. Global CSS additions

- `html, body { overflow-x: hidden; max-width: 100vw; }` (already present, verify).
- `.safe-pb` already present — applied to `MobileBottomNav` and main content.
- Fluid `clamp()` for h1–h4, body remains 16px+.
- `@media (max-width: 767px)` overrides for `.dialog-content` to slide up full-screen (covered by ResponsiveDialog).

### 8. QA

After edits, run:
- `tsgo` typecheck
- Build via existing harness
- Playwright sweep at 320, 375, 414, 768, 1024, 1440 capturing: landing, auth, each dashboard, halaqas, payments, payment-status — screenshot to `/tmp/browser/qa/`. Verify no horizontal scroll, no clipped text, no overflow.

### Technical notes

- Desktop unchanged: every change is `md:`-gated.
- No edits to `integrations/supabase/*`, `.env`, `supabase/config.toml`, RLS, or any `.functions.ts`/`.server.ts` handler logic.
- Existing `PremiumSidebar`, `MobileSidebar`, `MobileBottomNav`, `DashboardShell` kept; only minor className adjustments for safe-area + sticky.
- ResponsiveDialog uses existing `vaul` (already a dep via `drawer.tsx`).

### Out of scope

- Visual redesign / new color tokens — keep current Rawa premium look.
- New features, new routes, new tables, new endpoints.
- i18n changes beyond keys already present.

Approve and I'll start with the foundation primitives, then sweep pages in batches.
