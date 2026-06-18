import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";

type Tab = "overview" | "halaqas" | "teachers" | "supervisors" | "analytics" | "reports";

export function GeneralSupervisorDashboard() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: halaqas } = useQuery({
    queryKey: ["gs-halaqas"],
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("*, teacher:profiles!halaqas_teacher_id_fkey(id, full_name), supervisor:profiles!halaqas_supervisor_id_fkey(id, full_name), students:student_halaqas(count)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ["gs-att"],
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("status, date, halaqa_id, student_id").order("date", { ascending: false }).limit(5000);
      return data ?? [];
    },
  });

  const { data: evaluations } = useQuery({
    queryKey: ["gs-eval"],
    queryFn: async () => {
      const { data } = await supabase.from("evaluations").select("*, student:profiles!evaluations_student_id_fkey(full_name), teacher:profiles!evaluations_teacher_id_fkey(id, full_name)").order("created_at", { ascending: false }).limit(2000);
      return data ?? [];
    },
  });

  const { data: notes } = useQuery({
    queryKey: ["gs-sup-notes"],
    queryFn: async () => {
      const { data } = await supabase.from("supervisor_notes").select("*, student:profiles!supervisor_notes_student_id_fkey(full_name), author:profiles!supervisor_notes_author_id_fkey(id, full_name)").order("created_at", { ascending: false }).limit(500);
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const total = attendance?.length ?? 0;
    const present = attendance?.filter((a) => a.status === "present").length ?? 0;
    const totalStudents = halaqas?.reduce((a: number, h: any) => a + (h.students?.[0]?.count ?? 0), 0) ?? 0;
    return {
      halaqas: halaqas?.length ?? 0,
      students: totalStudents,
      active: halaqas?.filter((h: any) => h.status === "active").length ?? 0,
      rate: total ? Math.round((present / total) * 100) : 0,
    };
  }, [halaqas, attendance]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        badge="General supervisor"
        title={t("gs.title")}
        subtitle="Cross-halaqa monitoring · analytics · reports"
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Stat icon="🕌" label={t("nav.halaqas")} value={String(stats.halaqas)} />
        <Stat icon="🟢" label={t("gs.active_sessions")} value={String(stats.active)} />
        <Stat icon="🎓" label={t("common.students")} value={String(stats.students)} />
        <Stat icon="✅" label={t("sup.attendance_rate")} value={`${stats.rate}%`} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {(["overview","halaqas","teachers","supervisors","analytics","reports"] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px ${tab === k ? "border-gold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t(`gs.tab.${k}`)}</button>
        ))}
      </div>

      {tab === "overview" && <Overview halaqas={halaqas ?? []} attendance={attendance ?? []} />}
      {tab === "halaqas" && <HalaqasMon halaqas={halaqas ?? []} attendance={attendance ?? []} />}
      {tab === "teachers" && <TeachersMon halaqas={halaqas ?? []} evaluations={evaluations ?? []} />}
      {tab === "supervisors" && <SupervisorsMon halaqas={halaqas ?? []} attendance={attendance ?? []} notes={notes ?? []} />}
      {tab === "analytics" && <Analytics halaqas={halaqas ?? []} attendance={attendance ?? []} evaluations={evaluations ?? []} />}
      {tab === "reports" && <Reports halaqas={halaqas ?? []} attendance={attendance ?? []} evaluations={evaluations ?? []} notes={notes ?? []} />}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="p-5 rounded-2xl bg-card border border-border shadow-soft"><div className="text-3xl mb-2">{icon}</div><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-bold text-primary">{value}</div></div>;
}

function Overview({ halaqas, attendance }: { halaqas: any[]; attendance: any[] }) {
  const { t } = useI18n();
  const trend = useMemo(() => {
    const map = new Map<string, { date: string; present: number; total: number }>();
    attendance.forEach((a) => {
      const e = map.get(a.date) ?? { date: a.date, present: 0, total: 0 };
      e.total++;
      if (a.status === "present") e.present++;
      map.set(a.date, e);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-14).map((e) => ({ date: e.date.slice(5), rate: Math.round((e.present / e.total) * 100) }));
  }, [attendance]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-5 rounded-2xl bg-card border border-border">
        <h3 className="font-bold text-primary mb-3">{t("gs.trend")}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart>
        </ResponsiveContainer>
      </div>
      <div className="p-5 rounded-2xl bg-card border border-border">
        <h3 className="font-bold text-primary mb-3">{t("nav.halaqas")}</h3>
        <div className="space-y-2 max-h-[220px] overflow-y-auto">
          {halaqas.slice(0, 8).map((h: any) => (
            <div key={h.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
              <div><div className="font-semibold text-sm">{h.name}</div><div className="text-xs text-muted-foreground">{h.teacher?.full_name ?? "—"}</div></div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${h.status === "active" ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}>{h.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HalaqasMon({ halaqas, attendance }: { halaqas: any[]; attendance: any[] }) {
  const { t } = useI18n();
  const rateOf = (id: string) => {
    const rows = attendance.filter((a) => a.halaqa_id === id);
    if (!rows.length) return null;
    return Math.round((rows.filter((r) => r.status === "present").length / rows.length) * 100);
  };
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
          <th className="p-3 text-start">{t("common.name")}</th><th className="p-3 text-start">{t("common.teacher")}</th><th className="p-3 text-start">{t("common.supervisor")}</th><th className="p-3 text-start">{t("common.level")}</th><th className="p-3 text-start">{t("common.students")}</th><th className="p-3 text-start">{t("sup.attendance_rate")}</th><th className="p-3 text-start">{t("common.status")}</th>
        </tr></thead>
        <tbody>
          {halaqas.map((h: any) => {
            const r = rateOf(h.id);
            return <tr key={h.id} className="border-t border-border"><td className="p-3 font-semibold text-primary">{h.name}</td><td className="p-3">{h.teacher?.full_name ?? "—"}</td><td className="p-3">{h.supervisor?.full_name ?? "—"}</td><td className="p-3">{h.level}</td><td className="p-3">{h.students?.[0]?.count ?? 0}</td><td className="p-3">{r === null ? "—" : `${r}%`}</td><td className="p-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold">{h.status}</span></td></tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeachersMon({ halaqas, evaluations }: { halaqas: any[]; evaluations: any[] }) {
  const { t } = useI18n();
  const teachers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; halaqas: number; evals: number; avgScore: number }>();
    halaqas.forEach((h: any) => {
      if (!h.teacher) return;
      const e = map.get(h.teacher.id) ?? { id: h.teacher.id, name: h.teacher.full_name, halaqas: 0, evals: 0, avgScore: 0 };
      e.halaqas++; map.set(h.teacher.id, e);
    });
    evaluations.forEach((ev) => {
      const e = map.get(ev.teacher_id); if (!e) return;
      const scores = [ev.tajweed_score, ev.memorization_score, ev.fluency_score, ev.participation_score].filter((x) => x != null);
      if (scores.length) { e.avgScore = (e.avgScore * e.evals + scores.reduce((a, b) => a + b, 0) / scores.length) / (e.evals + 1); e.evals++; }
    });
    return Array.from(map.values());
  }, [halaqas, evaluations]);
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3 text-start">{t("common.teacher")}</th><th className="p-3 text-start">{t("nav.halaqas")}</th><th className="p-3 text-start">{t("dash.evaluations")}</th><th className="p-3 text-start">{t("gs.avg_score")}</th></tr></thead>
        <tbody>
          {teachers.map((tch) => <tr key={tch.id} className="border-t border-border"><td className="p-3 font-semibold text-primary">{tch.name}</td><td className="p-3">{tch.halaqas}</td><td className="p-3">{tch.evals}</td><td className="p-3">{tch.avgScore ? tch.avgScore.toFixed(1) : "—"}</td></tr>)}
          {!teachers.length && <tr><td colSpan={4} className="p-0"><EmptyState compact variant="students" title="No teacher data yet" description="Assign teachers to halaqas to see performance analytics here." /></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function SupervisorsMon({ halaqas, attendance, notes }: { halaqas: any[]; attendance: any[]; notes: any[] }) {
  const { t } = useI18n();
  const sups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; halaqas: number; recorded: number; notes: number }>();
    halaqas.forEach((h: any) => {
      if (!h.supervisor) return;
      const e = map.get(h.supervisor.id) ?? { id: h.supervisor.id, name: h.supervisor.full_name, halaqas: 0, recorded: 0, notes: 0 };
      e.halaqas++;
      e.recorded += attendance.filter((a) => a.halaqa_id === h.id).length;
      map.set(h.supervisor.id, e);
    });
    notes.forEach((n) => { const e = map.get(n.author?.id); if (e) e.notes++; });
    return Array.from(map.values());
  }, [halaqas, attendance, notes]);
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3 text-start">{t("common.supervisor")}</th><th className="p-3 text-start">{t("nav.halaqas")}</th><th className="p-3 text-start">{t("gs.records")}</th><th className="p-3 text-start">{t("sup.notes")}</th></tr></thead>
        <tbody>
          {sups.map((s) => <tr key={s.id} className="border-t border-border"><td className="p-3 font-semibold text-primary">{s.name}</td><td className="p-3">{s.halaqas}</td><td className="p-3">{s.recorded}</td><td className="p-3">{s.notes}</td></tr>)}
          {!sups.length && <tr><td colSpan={4} className="p-0"><EmptyState compact variant="students" title="No supervisor data" description="Assign supervisors to halaqas to track their activity." /></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

function Analytics({ halaqas, attendance, evaluations }: { halaqas: any[]; attendance: any[]; evaluations: any[] }) {
  const { t } = useI18n();
  const attData = [
    { name: t("common.present"), value: attendance.filter((a) => a.status === "present").length },
    { name: t("common.late"), value: attendance.filter((a) => a.status === "late").length },
    { name: t("common.absent"), value: attendance.filter((a) => a.status === "absent").length },
  ];
  const levelData = ["beginner", "intermediate", "advanced"].map((lvl) => ({ name: lvl, value: halaqas.filter((h: any) => h.level === lvl).length }));
  const scoreAvg = ["tajweed_score", "memorization_score", "fluency_score", "participation_score"].map((k) => {
    const vals = evaluations.map((e) => e[k]).filter((v) => v != null);
    return { name: k.replace("_score", ""), avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0 };
  });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title={t("gs.chart.attendance")}>
        <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={attData} dataKey="value" nameKey="name" outerRadius={80} label>{attData.map((_, i) => <Cell key={i} fill={COLORS[i + 1]} />)}</Pie><Legend /></PieChart></ResponsiveContainer>
      </Card>
      <Card title={t("gs.chart.scores")}>
        <ResponsiveContainer width="100%" height={240}><BarChart data={scoreAvg}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="avg" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
      </Card>
      <Card title={t("gs.chart.levels")}>
        <ResponsiveContainer width="100%" height={240}><BarChart data={levelData}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="value" fill="#f59e0b" /></BarChart></ResponsiveContainer>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="p-5 rounded-2xl bg-card border border-border"><h3 className="font-bold text-primary mb-3">{title}</h3>{children}</div>;
}

function Reports({ halaqas, attendance, evaluations, notes }: { halaqas: any[]; attendance: any[]; evaluations: any[]; notes: any[] }) {
  const { t } = useI18n();

  const reports = [
    {
      id: "attendance",
      label: t("gs.report.attendance"),
      rows: () => halaqas.map((h: any) => {
        const rows = attendance.filter((a) => a.halaqa_id === h.id);
        const p = rows.filter((r) => r.status === "present").length;
        return { Halaqa: h.name, Teacher: h.teacher?.full_name ?? "—", Sessions: rows.length, Present: p, Absent: rows.filter((r) => r.status === "absent").length, Late: rows.filter((r) => r.status === "late").length, Rate: rows.length ? `${Math.round(p / rows.length * 100)}%` : "—" };
      }),
    },
    {
      id: "progress",
      label: t("gs.report.progress"),
      rows: () => evaluations.map((e) => ({ Student: e.student?.full_name ?? "—", Halaqa: halaqas.find((h: any) => h.id === e.halaqa_id)?.name ?? "—", Tajweed: e.tajweed_score ?? "—", Memorization: e.memorization_score ?? "—", Fluency: e.fluency_score ?? "—", Participation: e.participation_score ?? "—", Date: new Date(e.created_at).toLocaleDateString() })),
    },
    {
      id: "teachers",
      label: t("gs.report.teachers"),
      rows: () => {
        const map = new Map<string, any>();
        halaqas.forEach((h: any) => { if (!h.teacher) return; const e = map.get(h.teacher.id) ?? { Teacher: h.teacher.full_name, Halaqas: 0, Evaluations: 0 }; e.Halaqas++; map.set(h.teacher.id, e); });
        evaluations.forEach((ev) => { const e = map.get(ev.teacher_id); if (e) e.Evaluations++; });
        return Array.from(map.values());
      },
    },
    {
      id: "supervisors",
      label: t("gs.report.supervisors"),
      rows: () => {
        const map = new Map<string, any>();
        halaqas.forEach((h: any) => { if (!h.supervisor) return; const e = map.get(h.supervisor.id) ?? { Supervisor: h.supervisor.full_name, Halaqas: 0, Records: 0, Notes: 0 }; e.Halaqas++; e.Records += attendance.filter((a) => a.halaqa_id === h.id).length; map.set(h.supervisor.id, e); });
        notes.forEach((n) => { const e = map.get(n.author?.id); if (e) e.Notes++; });
        return Array.from(map.values());
      },
    },
  ];

  const exportExcel = (id: string, label: string, rows: any[]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 30));
    XLSX.writeFile(wb, `${id}-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPdf = (id: string, label: string, rows: any[]) => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(label, 14, 16);
    if (rows.length) {
      autoTable(doc, { startY: 22, head: [Object.keys(rows[0])], body: rows.map((r) => Object.values(r) as any), styles: { fontSize: 8 }, headStyles: { fillColor: [30, 41, 59] } });
    }
    doc.save(`${id}-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {reports.map((r) => {
        const rows = r.rows();
        return (
          <div key={r.id} className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-primary">{r.label}</h3>
                <div className="text-xs text-muted-foreground mt-1">{rows.length} {t("gs.rows")}</div>
              </div>
              <span className="text-2xl">📊</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => exportExcel(r.id, r.label, rows)} className="flex-1 px-3 py-2 rounded-full bg-green-600 text-white text-xs font-semibold hover:bg-green-700">⬇ Excel</button>
              <button onClick={() => exportPdf(r.id, r.label, rows)} className="flex-1 px-3 py-2 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700">⬇ PDF</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}