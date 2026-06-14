import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Radio, CheckCircle2, BookOpen, Star, Users, Bell, Download,
  MessageSquare, Calendar, Target, Sparkles, ChevronRight, GraduationCap,
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
          "halaqa:halaqas(id, name, level, schedule, schedule_days, start_time, end_time, meeting_provider, meeting_link, live_session_active, current_surah, target_surah, teacher:profiles!halaqas_teacher_id_fkey(full_name), supervisor:profiles!halaqas_supervisor_id_fkey(full_name))"
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
      {/* TOP — Welcome + Live status */}
      <div className="grid lg:grid-cols-3 gap-6">
        <WelcomeCard parentName={parentName} child={child} halaqa={halaqa} />
        <LiveStatusCard halaqa={halaqa} />
      </div>

      {/* PROGRESS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CheckCircle2 />} label="الحضور" value={`${rate}%`} accent="from-emerald-500/20 to-emerald-400/5" tone="text-emerald-600" />
        <StatCard icon={<BookOpen />} label="الحفظ المكتمل" value={`${avgMem}%`} accent="from-primary/20 to-primary/5" tone="text-primary" />
        <StatCard icon={<Star />} label="التقييم العام" value={`${overall}%`} accent="from-gold/30 to-gold/5" tone="text-gold-foreground" />
        <StatCard icon={<Users />} label="عدد الحلقات" value={String(sessionsCount)} accent="from-secondary/20 to-secondary/5" tone="text-secondary" />
      </div>

      {/* MEMORIZATION + WEEKLY GOALS */}
      <div className="grid lg:grid-cols-3 gap-6">
        <MemorizationTracker halaqa={halaqa} percentage={avgMem} />
        <WeeklyGoals halaqa={halaqa} />
      </div>

      {/* ATTENDANCE chart + Teacher notes */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart monthly={monthly} present={present} absent={absent} late={late} />
        </div>
        <TeacherNotes notes={notes ?? []} />
      </div>

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

function WelcomeCard({
  parentName, child, halaqa,
}: { parentName: string; child: Child; halaqa: HalaqaInfo | null }) {
  const initials = (child.full_name ?? "ط").trim().slice(0, 1);
  return (
    <div className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-l from-primary via-primary/95 to-secondary text-primary-foreground shadow-[var(--shadow-glow)]">
      <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-gold/30 blur-3xl" />
      <div className="absolute -bottom-20 right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex items-start gap-5 flex-wrap">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-gold/40 blur-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-gold/70 text-dark text-3xl font-bold flex items-center justify-center shadow-xl">
            {child.avatar_url ? (
              <img src={child.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : initials}
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs uppercase tracking-wider text-primary-foreground/70 mb-1">أهلاً وسهلاً</div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ fontFamily: "var(--font-display-ar)" }}>
            {parentName} 👋
          </h1>
          <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <InfoRow label="الطالب" value={child.full_name ?? "—"} />
            <InfoRow label="الحلقة" value={halaqa?.name ?? "—"} />
            <InfoRow label="المعلم" value={halaqa?.teacher?.full_name ?? "—"} />
            <InfoRow label="المشرف" value={halaqa?.supervisor?.full_name ?? "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-primary-foreground/60 text-xs">{label}:</span>
      <span className="font-semibold truncate">{value}</span>
    </div>
  );
}

function LiveStatusCard({ halaqa }: { halaqa: HalaqaInfo | null }) {
  const isLive = !!halaqa?.live_session_active;
  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl border shadow-[var(--shadow-soft)] ${
      isLive ? "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-400/40" : "bg-card/70 border-border/60"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Radio className={`w-5 h-5 ${isLive ? "text-emerald-500" : "text-muted-foreground"}`} />
        <span className="text-sm font-semibold text-muted-foreground">حالة الحلقة</span>
      </div>
      {isLive ? (
        <>
          <div className="flex items-center gap-2 text-xl font-bold text-emerald-600">
            <span className="relative flex w-3 h-3">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-3 h-3 rounded-full bg-emerald-500" />
            </span>
            الحلقة مباشرة الآن
          </div>
          <p className="text-xs text-muted-foreground mt-1 mb-4">{halaqa?.name} · {halaqa?.teacher?.full_name}</p>
          {halaqa?.meeting_link && (
            <a href={halaqa.meeting_link} target="_blank" rel="noreferrer"
               className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition shadow-lg">
              انضم الآن
              <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-lg font-bold text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-muted-foreground/40" />
            لا توجد حلقة مباشرة حالياً
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {halaqa?.schedule_days?.join("، ") || halaqa?.schedule || "سيتم الإشعار عند بدء الجلسة"}
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, accent, tone,
}: { icon: React.ReactNode; label: string; value: string; accent: string; tone: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-card/70 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 transition">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} pointer-events-none`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
          <div className={`text-3xl font-bold mt-2 ${tone}`}>{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-card/70 flex items-center justify-center ${tone}`}>{icon}</div>
      </div>
    </div>
  );
}

function MemorizationTracker({ halaqa, percentage }: { halaqa: HalaqaInfo | null; percentage: number }) {
  const pct = Math.max(0, Math.min(100, percentage));
  return (
    <div className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 bg-card/70 backdrop-blur-xl border border-gold/30 shadow-[var(--shadow-soft)]">
      <div className="absolute -top-20 -left-10 w-60 h-60 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold to-gold/70 text-dark flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>متابعة الحفظ</div>
            <div className="text-xs text-muted-foreground">آخر تحديث من المعلم</div>
          </div>
        </div>
        <div className="text-3xl font-bold bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">
          {pct}%
        </div>
      </div>
      <div className="relative grid grid-cols-2 gap-4 mb-5">
        <div className="p-4 rounded-2xl bg-muted/40">
          <div className="text-[11px] text-muted-foreground mb-1">السورة الحالية</div>
          <div className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>
            {halaqa?.current_surah || "سورة الكهف"}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-muted/40">
          <div className="text-[11px] text-muted-foreground mb-1">الهدف</div>
          <div className="text-xl font-bold text-secondary" style={{ fontFamily: "var(--font-display-ar)" }}>
            {halaqa?.target_surah || "سورة مريم"}
          </div>
        </div>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-l from-primary via-secondary to-gold transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
    </div>
  );
}

function WeeklyGoals({ halaqa }: { halaqa: HalaqaInfo | null }) {
  const items = [
    { icon: "📖", label: "الحفظ هذا الأسبوع", value: halaqa?.current_surah ? `من ${halaqa.current_surah}` : "10 آيات جديدة", tone: "text-primary" },
    { icon: "🔁", label: "المراجعة المطلوبة", value: "الجزء السابق", tone: "text-secondary" },
    { icon: "🕊️", label: "المتون المطلوبة", value: "تحفة الأطفال", tone: "text-gold-foreground" },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-card/70 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-primary">أهداف الأسبوع</h3>
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition">
            <div className="text-2xl">{it.icon}</div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">{it.label}</div>
              <div className={`font-semibold truncate ${it.tone}`}>{it.value}</div>
            </div>
          </div>
        ))}
      </div>
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