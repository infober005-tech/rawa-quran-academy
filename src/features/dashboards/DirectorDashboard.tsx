import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

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
      ]);
      return { students: counts[0].count ?? 0, teachers: counts[1].count ?? 0, supervisors: counts[2].count ?? 0, halaqas: counts[3].count ?? 0 };
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
        { name: "Present", value: attRows.filter((a) => a.status === "present").length, color: "#10b981" },
        { name: "Late", value: attRows.filter((a) => a.status === "late").length, color: "#f59e0b" },
        { name: "Absent", value: attRows.filter((a) => a.status === "absent").length, color: "#ef4444" },
      ];
      const evalRows = evals.data ?? [];
      const avg = (k: keyof typeof evalRows[number]) => {
        const vals = evalRows.map((r: any) => r[k]).filter((n: any) => typeof n === "number");
        return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
      };
      const evalAverages = [
        { name: "Tajweed", score: avg("tajweed_score") },
        { name: "Memorization", score: avg("memorization_score") },
        { name: "Fluency", score: avg("fluency_score") },
        { name: "Participation", score: avg("participation_score") },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dir-pending"] }); qc.invalidateQueries({ queryKey: ["dir-stats"] }); toast.success("✓"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-primary">{t("nav.admin")} · {t("nav.dashboard")}</h1>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/admin" className="p-4 rounded-2xl bg-gradient-royal text-primary-foreground shadow-glow text-center font-semibold text-sm hover:opacity-90">👥 Users & Roles</Link>
        <Link to="/admin" className="p-4 rounded-2xl bg-card border border-border text-primary text-center font-semibold text-sm hover:bg-muted">🕌 Halaqas</Link>
        <Link to="/admin" className="p-4 rounded-2xl bg-card border border-border text-primary text-center font-semibold text-sm hover:bg-muted">🎉 Events</Link>
        <Link to="/admin" className="p-4 rounded-2xl bg-card border border-border text-primary text-center font-semibold text-sm hover:bg-muted">📅 Calendar</Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Stat icon="🎓" label={t("common.students")} value={String(stats?.students ?? 0)} />
        <Stat icon="👨‍🏫" label={t("common.teacher")} value={String(stats?.teachers ?? 0)} />
        <Stat icon="👁️" label={t("common.supervisor")} value={String(stats?.supervisors ?? 0)} />
        <Stat icon="🕌" label={t("nav.halaqas")} value={String(stats?.halaqas ?? 0)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
          <h3 className="font-bold text-primary mb-3">📊 Attendance</h3>
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
          <h3 className="font-bold text-primary mb-3">⭐ Evaluation Averages</h3>
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
          <h3 className="font-bold text-primary mb-3">🕌 Halaqas by Level</h3>
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
          {(!pending || pending.length === 0) && <div className="py-6 text-center text-muted-foreground text-sm">—</div>}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="p-5 rounded-2xl bg-card border border-border shadow-soft"><div className="text-3xl mb-2">{icon}</div><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-bold text-primary">{value}</div></div>;
}