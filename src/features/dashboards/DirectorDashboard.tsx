import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";

export function DirectorDashboard() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["dir-stats"],
    queryFn: async () => {
      const counts = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "halaqa_supervisor"),
        supabase.from("halaqas").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        students: counts[0].count ?? 0,
        teachers: counts[1].count ?? 0,
        supervisors: counts[2].count ?? 0,
        halaqas: counts[3].count ?? 0,
        pendingPayments: counts[4].count ?? 0,
      };
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["dir-analytics"],
    queryFn: async () => {
      const [att, evals, events, halaqasByLevel] = await Promise.all([
        supabase.from("attendance").select("status").limit(2000),
        supabase.from("evaluations").select("tajweed_score, memorization_score, fluency_score, participation_score").limit(500),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("halaqas").select("level"),
      ]);
      const attRows = att.data ?? [];
      const attBreakdown = [
        { name: t("common.present"), value: attRows.filter((a) => a.status === "present").length, color: "#10b981" },
        { name: t("common.late"), value: attRows.filter((a) => a.status === "late").length, color: "#f59e0b" },
        { name: t("common.absent"), value: attRows.filter((a) => a.status === "absent").length, color: "#ef4444" },
      ];
      const evalRows = evals.data ?? [];
      const avg = (k: keyof typeof evalRows[number]) => {
        const vals = evalRows.map((r: any) => r[k]).filter((n: any) => typeof n === "number");
        return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
      };
      const evalAverages = [
        { name: t("d.score.tajweed"), score: avg("tajweed_score") },
        { name: t("d.score.memorization"), score: avg("memorization_score") },
        { name: t("d.score.fluency"), score: avg("fluency_score") },
        { name: t("d.score.participation"), score: avg("participation_score") },
      ];
      const levelCounts: Record<string, number> = {};
      (halaqasByLevel.data ?? []).forEach((h: any) => { levelCounts[h.level] = (levelCounts[h.level] ?? 0) + 1; });
      const levels = Object.entries(levelCounts).map(([name, value]) => ({ name, value }));
      return { attBreakdown, evalAverages, levels, events: events.count ?? 0 };
    },
  });

  const { data: pending } = useQuery({
    queryKey: ["dir-pending"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("status", "pending_review").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.from("profiles").update({ status: approve ? "approved" : "rejected" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dir-pending"] }); qc.invalidateQueries({ queryKey: ["dir-stats"] }); toast.success(t("common.saved")); },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["dir-upcoming-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date")
        .eq("status", "published")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: liveHalaqas } = useQuery({
    queryKey: ["dir-live"],
    queryFn: async () => {
      const { data } = await supabase
        .from("halaqas")
        .select("id, name")
        .eq("live_session_active", true)
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        badge={t("d.director.badge")}
        title={`${t("nav.admin")} · ${t("nav.dashboard")}`}
        subtitle={t("d.academy_subtitle")}
        actions={
          liveHalaqas && liveHalaqas.length > 0 ? (
            <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-600 text-xs font-bold animate-pulse">
              ● {liveHalaqas.length} {t("d.live")}
            </span>
          ) : null
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link to="/admin" className="p-4 rounded-2xl bg-gradient-royal text-primary-foreground shadow-glow text-center font-semibold text-sm hover:opacity-90 transition">👥 {t("d.director.users")}</Link>
        <Link to="/halaqas" className="p-4 rounded-2xl glass-card text-primary text-center font-semibold text-sm hover:shadow-glow transition">🕌 {t("nav.halaqas")}</Link>
        <Link to="/events" className="p-4 rounded-2xl glass-card text-primary text-center font-semibold text-sm hover:shadow-glow transition">🎉 {t("nav.events")}</Link>
        <Link to="/admin" className="p-4 rounded-2xl glass-card text-primary text-center font-semibold text-sm hover:shadow-glow transition">💳 {t("d.director.payments")}</Link>
        <Link to="/notifications" className="p-4 rounded-2xl glass-card text-primary text-center font-semibold text-sm hover:shadow-glow transition">🔔 {t("d.director.notify")}</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Stat icon="🎓" label={t("common.students")} value={String(stats?.students ?? 0)} />
        <Stat icon="👨‍🏫" label={t("common.teacher")} value={String(stats?.teachers ?? 0)} />
        <Stat icon="👁️" label={t("common.supervisor")} value={String(stats?.supervisors ?? 0)} />
        <Stat icon="🕌" label={t("nav.halaqas")} value={String(stats?.halaqas ?? 0)} />
        <Stat icon="💳" label={t("d.director.pending_pay")} value={String(stats?.pendingPayments ?? 0)} accent />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
          <h3 className="font-bold text-primary mb-3">📊 {t("dash.attendance")}</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={analytics?.attBreakdown ?? []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                  {(analytics?.attBreakdown ?? []).map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
          <h3 className="font-bold text-primary mb-3">⭐ {t("d.director.eval_averages")}</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={analytics?.evalAverages ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
          <h3 className="font-bold text-primary mb-3">🕌 {t("d.director.halaqas_by_level")}</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={analytics?.levels ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
        <h2 className="text-xl font-bold text-primary mb-4">⏳ {t("dir.pending_students")} <span className="text-sm text-muted-foreground">({pending?.length ?? 0})</span></h2>
        <div className="divide-y divide-border">
          {pending?.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold text-primary">{p.full_name || p.email}</div>
                <div className="text-xs text-muted-foreground">{p.email} · {p.gender ?? "—"} · {p.quran_level ?? "—"} · {p.country ?? "—"}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide.mutate({ id: p.id, approve: true })} className="px-4 py-1.5 rounded-full bg-green-600 text-white text-xs font-semibold">{t("dir.approve")}</button>
                <button onClick={() => decide.mutate({ id: p.id, approve: false })} className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-semibold">{t("dir.reject")}</button>
              </div>
            </div>
          ))}
          {(!pending || pending.length === 0) && (
            <EmptyState
              compact
              variant="students"
              title={t("d.director.no_pending_students")}
              description={t("d.director.no_pending_students_desc")}
            />
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
        <h2 className="text-xl font-bold text-primary mb-4">📅 {t("d.upcoming_events")}</h2>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="divide-y divide-border">
            {upcomingEvents.map((e) => (
              <Link key={e.id} to="/events" className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 rounded-xl px-2 transition">
                <div className="font-semibold text-primary text-sm truncate">{e.title}</div>
                <div className="text-xs text-muted-foreground shrink-0">{new Date(e.date).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            variant="events"
            title={t("d.no_upcoming_events")}
            description={t("d.director.no_upcoming_events_desc")}
            action={<Link to="/admin" className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-semibold shadow-glow">+ {t("d.director.create_event")}</Link>}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-4 md:p-5 rounded-2xl border shadow-soft transition hover:shadow-premium ${accent ? "border-gold/40 bg-gradient-to-br from-gold/15 to-card" : "border-border bg-card"}`}>
      <div className="text-2xl md:text-3xl mb-1.5">{icon}</div>
      <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-xl md:text-2xl font-black mt-0.5 ${accent ? "text-gold-foreground" : "text-primary"}`}>{value}</div>
    </div>
  );
}