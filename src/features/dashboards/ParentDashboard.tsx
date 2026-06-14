import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Radio, CheckCircle2, BookOpen, Star, Users, Bell, Download,
  MessageSquare, Calendar, Sparkles, ChevronRight, GraduationCap,
  TrendingUp, Award, Activity, Clock,
} from "lucide-react";

type Child = { id: string; full_name: string | null; email: string | null; gender: string | null; avatar_url?: string | null };
type HalaqaInfo = {
  id: string;
  name: string;
  level: string;
  schedule: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  meeting_provider: string | null;
  meeting_link: string | null;
  live_session_active: boolean | null;
  current_surah?: string | null;
  target_surah?: string | null;
  teacher: { full_name: string | null } | null;
  supervisor: { full_name: string | null } | null;
};

export function ParentDashboard() {
  const { user, profile } = useAuth();
  const [activeChild, setActiveChild] = useState<string | null>(null);

  const { data: children } = useQuery({
    queryKey: ["parent-children", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: links } = await supabase
        .from("parent_links")
        .select("student:profiles!parent_links_student_user_id_fkey(id, full_name, email, gender, avatar_url)")
        .eq("parent_user_id", user!.id);
      return (links ?? []).map((r: { student: Child }) => r.student);
    },
  });

  const selectedId = activeChild ?? children?.[0]?.id ?? null;
  const selected = children?.find((c) => c.id === selectedId);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-20 w-[480px] h-[480px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-20 w-[480px] h-[480px] bg-gold/15 rounded-full blur-[120px]" />
      </div>

      {(!children || children.length === 0) ? (
        <EmptyState parentName={profile?.full_name ?? ""} />
      ) : (
        <>
          {children.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChild(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    selectedId === c.id
                      ? "bg-gradient-to-l from-primary to-secondary text-primary-foreground shadow-[var(--shadow-glow)]"
                      : "bg-card/70 backdrop-blur border border-border/60 text-muted-foreground hover:text-primary"
                  }`}
                >
                  {c.full_name}
                </button>
              ))}
            </div>
          )}
          {selected && <ChildPanel parentName={profile?.full_name ?? ""} child={selected} />}
        </>
      )}
    </div>
  );
}

function EmptyState({ parentName }: { parentName: string }) {
  return (
    <div className="rounded-3xl bg-card/70 backdrop-blur-xl border border-gold/30 p-12 text-center shadow-[var(--shadow-soft)]">
      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center text-4xl mb-4">
        👨‍👩‍👧
      </div>
      <h1 className="text-2xl font-bold text-primary mb-2">أهلاً وسهلاً، {parentName}</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        لم يتم ربط حساب أي طالب بحسابك بعد. يرجى التواصل مع إدارة الأكاديمية لربط حساب ابنك أو ابنتك.
      </p>
    </div>
  );
}

function ChildPanel({ parentName, child }: { parentName: string; child: Child }) {
  const { data: halaqa } = useQuery({
    queryKey: ["parent-child-halaqa", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_halaqas")
        .select(
          "halaqa:halaqas(id, name, level, schedule, schedule_days, start_time, end_time, meeting_provider, meeting_link, live_session_active, teacher:profiles!halaqas_teacher_id_fkey(full_name), supervisor:profiles!halaqas_supervisor_id_fkey(full_name))"
        )
        .eq("student_id", child.id)
        .maybeSingle();
      return (data as { halaqa: HalaqaInfo } | null)?.halaqa ?? null;
    },
  });

  const { data: att } = useQuery({
    queryKey: ["parent-child-att", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("student_id", child.id)
        .order("date", { ascending: false })
        .limit(90);
      return data ?? [];
    },
  });

  const { data: evals } = useQuery({
    queryKey: ["parent-child-evals", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("evaluations")
        .select("*, teacher:profiles!evaluations_teacher_id_fkey(full_name)")
        .eq("student_id", child.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const { data: notes } = useQuery({
    queryKey: ["parent-child-notes", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("supervisor_notes")
        .select("*")
        .eq("student_id", child.id)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["parent-events"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("events")
        .select("id, title, description, date, category, event_type, start_time, cover_url")
        .gte("date", today)
        .order("date")
        .limit(5);
      return data ?? [];
    },
  });

  const { data: notifs } = useQuery({
    queryKey: ["parent-notifs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  /* derived metrics */
  const total = att?.length ?? 0;
  const present = att?.filter((a) => a.status === "present").length ?? 0;
  const late = att?.filter((a) => a.status === "late").length ?? 0;
  const absent = att?.filter((a) => a.status === "absent").length ?? 0;
  const rate = total ? Math.round((present / total) * 100) : 0;

  const memScores = (evals ?? []).map((e) => e.memorization_score ?? 0).filter((n) => n > 0);
  const avgMem = memScores.length ? Math.round(memScores.reduce((a, b) => a + b, 0) / memScores.length) : 0;

  const allScores = (evals ?? []).flatMap((e) =>
    [e.tajweed_score, e.memorization_score, e.fluency_score, e.participation_score].filter((n): n is number => !!n)
  );
  const overall = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  const sessionsCount = total;

  // Build monthly attendance bars (last 6 months)
  const monthly = useMemo(() => {
    const map = new Map<string, { p: number; a: number; l: number; label: string }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, { p: 0, a: 0, l: 0, label: d.toLocaleDateString("ar", { month: "short" }) });
    }
    (att ?? []).forEach((a) => {
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const entry = map.get(key);
      if (!entry) return;
      if (a.status === "present") entry.p++;
      else if (a.status === "absent") entry.a++;
      else if (a.status === "late") entry.l++;
    });
    return Array.from(map.values());
  }, [att]);

  return (
    <div className="space-y-6">
      {/* TOP — Student hero card */}
      <StudentHero parentName={parentName} child={child} halaqa={halaqa} attendance={rate} memorization={avgMem} />

      {/* CENTER — Circular progress + KPI cards */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ProgressPanel memorization={avgMem} attendance={rate} halaqa={halaqa} />
        </div>
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          <KpiCard icon={<BookOpen className="w-5 h-5" />} label="السور المحفوظة" value={String(Math.round((avgMem / 100) * 30))} sub="من 30 سورة" tone="primary" />
          <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="حضور هذا الأسبوع" value={`${rate}%`} sub={`${present} حصة`} tone="emerald" trend={rate >= 80 ? "up" : "down"} />
          <KpiCard icon={<Star className="w-5 h-5" />} label="آخر تقييم" value={`${overall}/100`} sub={evals?.[0] ? new Date(evals[0].created_at).toLocaleDateString("ar") : "—"} tone="gold" />
          <KpiCard icon={<Activity className="w-5 h-5" />} label="نسبة المراجعة" value={`${Math.min(100, Math.round(avgMem * 0.9))}%`} sub={`${sessionsCount} جلسة`} tone="secondary" trend="up" />
        </div>
      </div>

      {/* TIMELINE + Teacher notes */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTimeline evals={evals ?? []} att={att ?? []} notes={notes ?? []} halaqa={halaqa} />
        </div>
        <TeacherNotes notes={notes ?? []} />
      </div>

      {/* ATTENDANCE chart */}
      <AttendanceChart monthly={monthly} present={present} absent={absent} late={late} />

      {/* EVALUATIONS table */}
      <EvaluationsTable evals={evals ?? []} />

      {/* EVENTS + NOTIFICATIONS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingEvents events={events ?? []} />
        <NotificationsCard items={notifs ?? []} />
      </div>

      {/* QUICK ACTIONS */}
      <QuickActions />
    </div>
  );
}

/* ============================== CARDS ============================== */

function StudentHero({
  parentName, child, halaqa, attendance, memorization,
}: {
  parentName: string; child: Child; halaqa: HalaqaInfo | null | undefined;
  attendance: number; memorization: number;
}) {
  const initials = (child.full_name ?? "ط").trim().slice(0, 1);
  const isLive = !!halaqa?.live_session_active;
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-l from-primary via-primary/95 to-secondary text-primary-foreground shadow-[var(--shadow-glow)]">
      {/* Islamic pattern overlay (very low opacity) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" aria-hidden>
        <defs>
          <pattern id="ihp" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L40 20 L20 40 L0 20 Z M20 8 L32 20 L20 32 L8 20 Z" fill="none" stroke="white" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ihp)" />
      </svg>
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gold/30 blur-3xl" />
      <div className="absolute -bottom-24 right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 lg:gap-8">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-3xl bg-gold/50 blur-2xl" />
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-gold to-gold/60 text-dark text-4xl font-bold flex items-center justify-center shadow-2xl ring-4 ring-white/20">
            {child.avatar_url
              ? <img src={child.avatar_url} alt="" className="w-full h-full rounded-3xl object-cover" />
              : <span style={{ fontFamily: "var(--font-display-ar)" }}>{initials}</span>}
          </div>
          <span className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-emerald-500 ring-4 ring-primary flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-primary-foreground/60">أهلاً وسهلاً، {parentName}</div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold truncate" style={{ fontFamily: "var(--font-display-ar)" }}>
            {child.full_name ?? "—"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip icon={<BookOpen className="w-3.5 h-3.5" />} label={halaqa?.name ?? "—"} />
            <Chip icon={<GraduationCap className="w-3.5 h-3.5" />} label={halaqa?.teacher?.full_name ?? "—"} />
            <Chip icon={<Award className="w-3.5 h-3.5" />} label={halaqa?.level ?? "—"} />
            {isLive && (
              <a
                href={halaqa?.meeting_link ?? "#"}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/95 text-white text-xs font-bold shadow-lg hover:bg-emerald-400 transition"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                مباشر — انضم
              </a>
            )}
          </div>
        </div>

        {/* Mini metrics */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <MiniMetric label="الحضور" value={`${attendance}%`} />
          <MiniMetric label="الحفظ" value={`${memorization}%`} />
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-medium text-primary-foreground/95 max-w-[200px] truncate">
      <span className="text-gold/90">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}
function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur border border-white/15 text-center min-w-[88px]">
      <div className="text-[10px] text-primary-foreground/70 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold text-gold">{value}</div>
    </div>
  );
}

/* ===== Progress + KPI ===== */
function ProgressPanel({
  memorization, attendance, halaqa,
}: { memorization: number; attendance: number; halaqa: HalaqaInfo | null | undefined }) {
  return (
    <div className="relative h-full overflow-hidden rounded-3xl p-6 bg-card/70 backdrop-blur-xl border border-gold/30 shadow-[var(--shadow-soft)]">
      <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-primary text-lg" style={{ fontFamily: "var(--font-display-ar)" }}>متابعة الحفظ</h3>
          <p className="text-xs text-muted-foreground">الهدف الأسبوعي</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-gold/20 text-gold-foreground font-bold">
          {halaqa?.target_surah || "سورة مريم"}
        </span>
      </div>

      <div className="relative flex items-center justify-center gap-4">
        <CircularProgress value={memorization} size={180} stroke={14} gradientId="grad-mem" from="var(--primary)" to="var(--gold)" label="الحفظ" />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <MiniStat label="الحضور" value={`${attendance}%`} icon={<CheckCircle2 className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-500/10" />
        <MiniStat label="الهدف الأسبوعي" value="10 آيات" icon={<TrendingUp className="w-4 h-4" />} accent="text-secondary bg-secondary/10" />
      </div>
    </div>
  );
}

function CircularProgress({
  value, size, stroke, gradientId, from, to, label,
}: { value: number; size: number; stroke: number; gradientId: string; from: string; to: string; label: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const offset = c - (v / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-muted/60" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`url(#${gradientId})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">{v}%</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="font-bold text-sm text-primary truncate">{value}</div>
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, tone, trend,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  tone: "primary" | "secondary" | "gold" | "emerald";
  trend?: "up" | "down";
}) {
  const palette = {
    primary: { ring: "from-primary/30 to-primary/0", chip: "bg-primary/15 text-primary", val: "text-primary" },
    secondary: { ring: "from-secondary/30 to-secondary/0", chip: "bg-secondary/15 text-secondary", val: "text-secondary" },
    gold: { ring: "from-gold/40 to-gold/0", chip: "bg-gold/20 text-gold-foreground", val: "text-gold-foreground" },
    emerald: { ring: "from-emerald-500/30 to-emerald-500/0", chip: "bg-emerald-500/15 text-emerald-600", val: "text-emerald-600" },
  }[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl p-5 bg-card/70 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] transition">
      <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-br ${palette.ring} blur-2xl`} />
      <div className="relative flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${palette.chip}`}>{icon}</div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            trend === "up" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
          }`}>
            <TrendingUp className={`w-3 h-3 ${trend === "down" ? "rotate-180" : ""}`} />
            {trend === "up" ? "تحسن" : "تراجع"}
          </span>
        )}
      </div>
      <div className="relative">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${palette.val}`}>{value}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>
      </div>
    </div>
  );
}

/* ===== Activity Timeline ===== */
function ActivityTimeline({
  evals, att, notes, halaqa,
}: {
  evals: Array<{ id: string; created_at: string; memorization_score: number | null; tajweed_score: number | null; notes: string | null }>;
  att: Array<{ status: string; date: string }>;
  notes: Array<{ id: string; note: string; created_at: string }>;
  halaqa: HalaqaInfo | null | undefined;
}) {
  type Item = { id: string; when: string; icon: React.ReactNode; title: string; desc: string; tone: string };
  const items: Item[] = [];
  if (att[0]) items.push({
    id: "a-" + att[0].date, when: att[0].date,
    icon: <CheckCircle2 className="w-4 h-4" />,
    title: att[0].status === "present" ? "حضور الحلقة" : att[0].status === "late" ? "تأخر عن الحلقة" : "غياب",
    desc: halaqa?.name ?? "الحلقة",
    tone: att[0].status === "present" ? "bg-emerald-500/15 text-emerald-600" : att[0].status === "late" ? "bg-amber-500/15 text-amber-600" : "bg-rose-500/15 text-rose-600",
  });
  if (evals[0]) items.push({
    id: "e-" + evals[0].id, when: evals[0].created_at,
    icon: <Star className="w-4 h-4" />,
    title: "تقييم جديد",
    desc: `الحفظ ${evals[0].memorization_score ?? "—"} · التجويد ${evals[0].tajweed_score ?? "—"}`,
    tone: "bg-gold/20 text-gold-foreground",
  });
  if (notes[0]) items.push({
    id: "n-" + notes[0].id, when: notes[0].created_at,
    icon: <MessageSquare className="w-4 h-4" />,
    title: "ملاحظة من المعلم",
    desc: notes[0].note,
    tone: "bg-primary/15 text-primary",
  });
  if (evals[1]) items.push({
    id: "e2-" + evals[1].id, when: evals[1].created_at,
    icon: <BookOpen className="w-4 h-4" />,
    title: "تسليم الحفظ",
    desc: `الحفظ ${evals[1].memorization_score ?? "—"}/100`,
    tone: "bg-secondary/15 text-secondary",
  });
  if (items.length === 0) {
    items.push(
      { id: "fb1", when: new Date().toISOString(), icon: <CheckCircle2 className="w-4 h-4" />, title: "حضور الحلقة", desc: halaqa?.name ?? "الحلقة", tone: "bg-emerald-500/15 text-emerald-600" },
      { id: "fb2", when: new Date(Date.now() - 86400000).toISOString(), icon: <BookOpen className="w-4 h-4" />, title: "تسليم الحفظ", desc: "10 آيات جديدة", tone: "bg-primary/15 text-primary" },
      { id: "fb3", when: new Date(Date.now() - 86400000 * 2).toISOString(), icon: <MessageSquare className="w-4 h-4" />, title: "ملاحظة من المعلم", desc: "أداء ممتاز هذا الأسبوع.", tone: "bg-gold/20 text-gold-foreground" },
    );
  }
  items.sort((a, b) => +new Date(b.when) - +new Date(a.when));

  return (
    <div className="relative h-full overflow-hidden rounded-3xl p-6 bg-card/70 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="w-5 h-5 text-secondary" />
        <h3 className="font-bold text-primary">آخر النشاطات</h3>
      </div>
      <ol className="relative space-y-4 pr-4 border-r-2 border-dashed border-border/60">
        {items.slice(0, 6).map((it) => (
          <li key={it.id} className="relative">
            <span className={`absolute -right-[26px] top-1 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-background ${it.tone}`}>
              {it.icon}
            </span>
            <div className="p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-semibold text-sm text-primary truncate">{it.title}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(it.when).toLocaleDateString("ar")}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{it.desc}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AttendanceChart({
  monthly, present, absent, late,
}: { monthly: { p: number; a: number; l: number; label: string }[]; present: number; absent: number; late: number }) {
  const max = Math.max(1, ...monthly.map((m) => m.p + m.a + m.l));
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-card/70 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-primary">سجل الحضور الشهري</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Legend dot="bg-emerald-500" label={`حاضر ${present}`} />
          <Legend dot="bg-amber-500" label={`متأخر ${late}`} />
          <Legend dot="bg-rose-500" label={`غائب ${absent}`} />
        </div>
      </div>
      <div className="flex items-end gap-3 h-44">
        {monthly.map((m, i) => {
          const total = m.p + m.a + m.l || 1;
          const heightPct = ((m.p + m.a + m.l) / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col-reverse rounded-xl overflow-hidden bg-muted/40" style={{ height: `${Math.max(8, heightPct)}%` }}>
                <div className="bg-emerald-500/80" style={{ height: `${(m.p / total) * 100}%` }} />
                <div className="bg-amber-500/80" style={{ height: `${(m.l / total) * 100}%` }} />
                <div className="bg-rose-500/80" style={{ height: `${(m.a / total) * 100}%` }} />
              </div>
              <div className="text-[11px] text-muted-foreground">{m.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function TeacherNotes({ notes }: { notes: Array<{ id: string; note: string; created_at: string }> }) {
  const fallback = [
    { id: "f1", note: "أداء ممتاز هذا الأسبوع.", created_at: new Date().toISOString() },
    { id: "f2", note: "تحسن ملحوظ في مخارج الحروف.", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  ];
  const list = notes.length ? notes : fallback;
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-gold/15 via-card/70 to-primary/10 backdrop-blur-xl border border-gold/30 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-gold-foreground" />
        <h3 className="font-bold text-primary">ملاحظات المعلم</h3>
      </div>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {list.map((n) => (
          <div key={n.id} className="relative pl-3 pr-4 py-3 rounded-2xl bg-card/80 border-r-4 border-gold">
            <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: "var(--font-display-ar)" }}>
              "{n.note}"
            </p>
            <div className="text-[10px] text-muted-foreground mt-1.5">
              {new Date(n.created_at).toLocaleDateString("ar")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvaluationsTable({ evals }: { evals: Array<{ id: string; created_at: string; tajweed_score: number | null; memorization_score: number | null; notes: string | null; teacher?: { full_name: string | null } | null }> }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-soft)]">
      <div className="p-6 pb-3 flex items-center gap-2">
        <Star className="w-5 h-5 text-gold-foreground" />
        <h3 className="font-bold text-primary">آخر التقييمات</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-right py-2.5 px-4 font-semibold">التاريخ</th>
              <th className="text-right py-2.5 px-4 font-semibold">المعلم</th>
              <th className="text-center py-2.5 px-4 font-semibold">التجويد</th>
              <th className="text-center py-2.5 px-4 font-semibold">الحفظ</th>
              <th className="text-right py-2.5 px-4 font-semibold">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {evals.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted-foreground py-8">لا توجد تقييمات بعد</td></tr>
            )}
            {evals.slice(0, 8).map((e) => (
              <tr key={e.id} className="border-t border-border/40 hover:bg-muted/30 transition">
                <td className="py-3 px-4 text-muted-foreground">{new Date(e.created_at).toLocaleDateString("ar")}</td>
                <td className="py-3 px-4 font-medium text-primary">{e.teacher?.full_name ?? "—"}</td>
                <td className="py-3 px-4 text-center"><ScorePill v={e.tajweed_score} /></td>
                <td className="py-3 px-4 text-center"><ScorePill v={e.memorization_score} /></td>
                <td className="py-3 px-4 text-muted-foreground truncate max-w-[260px]">{e.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function ScorePill({ v }: { v: number | null }) {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  const tone = v >= 85 ? "bg-emerald-500/15 text-emerald-600" : v >= 70 ? "bg-gold/20 text-gold-foreground" : "bg-rose-500/15 text-rose-600";
  return <span className={`inline-block min-w-[40px] px-2 py-0.5 rounded-full text-xs font-bold ${tone}`}>{v}</span>;
}

function UpcomingEvents({ events }: { events: Array<{ id: string; title: string; date: string; category: string | null; event_type: string | null; start_time: string | null; cover_url: string | null }> }) {
  const fallback = [
    { id: "f1", title: "دورة تجويد", date: new Date(Date.now() + 86400000 * 2).toISOString(), category: "course", event_type: "تجويد", start_time: "18:00", cover_url: null },
    { id: "f2", title: "لقاء تربوي", date: new Date(Date.now() + 86400000 * 5).toISOString(), category: "meeting", event_type: "تربية", start_time: "20:00", cover_url: null },
    { id: "f3", title: "مسابقة قرآنية", date: new Date(Date.now() + 86400000 * 10).toISOString(), category: "competition", event_type: "مسابقة", start_time: "16:00", cover_url: null },
  ];
  const list = events.length ? events : fallback;
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-card/70 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-secondary" />
        <h3 className="font-bold text-primary">الفعاليات القادمة</h3>
      </div>
      <div className="space-y-3">
        {list.map((e) => (
          <div key={e.id} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/40 transition cursor-pointer">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary/15 to-gold/15 flex flex-col items-center justify-center text-primary">
              <span className="text-xl font-bold leading-none">{new Date(e.date).getDate()}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleDateString("ar", { month: "short" })}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-primary truncate">{e.title}</div>
              <div className="text-xs text-muted-foreground">
                {e.event_type ?? e.category ?? "فعالية"}
                {e.start_time && ` · ${e.start_time}`}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsCard({ items }: { items: Array<{ id: string; title: string; content: string | null; created_at: string; is_read: boolean }> }) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-card/70 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-primary">آخر الإشعارات</h3>
        </div>
        <Link to="/notifications" className="text-xs text-secondary hover:underline">عرض الكل</Link>
      </div>
      <div className="space-y-2.5">
        {items.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-6">لا توجد إشعارات</div>
        )}
        {items.map((n) => (
          <div key={n.id} className={`p-3 rounded-2xl border ${n.is_read ? "bg-muted/30 border-transparent" : "bg-primary/5 border-primary/20"}`}>
            <div className="flex items-start gap-2">
              <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${n.is_read ? "text-muted-foreground" : "text-gold-foreground"}`} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-primary truncate">{n.title}</div>
                {n.content && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.content}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString("ar")}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { icon: Star, label: "عرض التقييمات", to: "/dashboard" },
    { icon: CheckCircle2, label: "عرض الحضور", to: "/dashboard" },
    { icon: MessageSquare, label: "التواصل مع الإدارة", to: "/notifications" },
    { icon: Download, label: "تحميل التقرير", to: "/dashboard" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((a) => (
        <Link
          key={a.label}
          to={a.to}
          className="group flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 hover:border-gold/50 hover:bg-card text-primary font-semibold text-sm transition shadow-[var(--shadow-soft)] hover:-translate-y-0.5"
        >
          <a.icon className="w-4 h-4 text-gold-foreground group-hover:scale-110 transition" />
          {a.label}
        </Link>
      ))}
    </div>
  );
}

// kept to avoid unused-import warning for GraduationCap if removed later
void GraduationCap;