import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { upsertAttendanceRecord } from "@/lib/attendance.functions";
import { useI18n } from "@/lib/i18n";

type Status = "present" | "late" | "absent";

type Row = {
  id: string;
  date: string;
  status: Status;
  notes: string | null;
  checked_in_at: string | null;
  is_manual: boolean | null;
  user_agent: string | null;
  ip_address: string | null;
  latitude: number | null;
  longitude: number | null;
  device_info: Record<string, unknown> | null;
  student: { id: string; full_name: string | null } | null;
  halaqa: { id: string; name: string; teacher_id: string | null } | null;
};

const STATUS_COLORS: Record<Status, string> = {
  present: "#10b981",
  late: "#f59e0b",
  absent: "#ef4444",
};

function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

export function AttendancePanel() {
  const upsert = useServerFn(upsertAttendanceRecord);
  const { t, lang } = useI18n();

  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [halaqaId, setHalaqaId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [studentQuery, setStudentQuery] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [editing, setEditing] = useState<Row | null>(null);

  useRealtimeInvalidate(["attendance"], ["admin-attendance"]);

  const { data: halaqas = [] } = useQuery({
    queryKey: ["admin-att-halaqas"],
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("id, name, teacher_id").order("name");
      return data ?? [];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["admin-att-teachers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profile:profiles!user_roles_user_id_fkey(id, full_name)")
        .eq("role", "teacher");
      return (data ?? []).map((r: any) => r.profile).filter(Boolean) as { id: string; full_name: string | null }[];
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-attendance", from, to, halaqaId, teacherId, status],
    queryFn: async () => {
      let q = supabase
        .from("attendance")
        .select(
          "id, date, status, notes, checked_in_at, is_manual, user_agent, ip_address, latitude, longitude, device_info, student:profiles!attendance_student_id_fkey(id, full_name), halaqa:halaqas!attendance_halaqa_id_fkey(id, name, teacher_id)",
        )
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .limit(2000);
      if (halaqaId) q = q.eq("halaqa_id", halaqaId);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      let out = (data ?? []) as unknown as Row[];
      if (teacherId) out = out.filter((r) => r.halaqa?.teacher_id === teacherId);
      return out;
    },
  });

  const filtered = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.student?.full_name ?? "").toLowerCase().includes(q));
  }, [rows, studentQuery]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const by: Record<Status, number> = { present: 0, late: 0, absent: 0 };
    for (const r of filtered) by[r.status] = (by[r.status] ?? 0) + 1;
    const rate = total ? Math.round((by.present / total) * 100) : 0;
    return { total, by, rate };
  }, [filtered]);

  const chartByDay = useMemo(() => {
    const map: Record<string, { date: string; present: number; late: number; absent: number }> = {};
    for (const r of filtered) {
      map[r.date] ??= { date: r.date, present: 0, late: 0, absent: 0 };
      map[r.date][r.status]++;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const pieData = useMemo(() =>
    (["present", "late", "absent"] as Status[])
      .map((s) => ({ name: s, value: stats.by[s] }))
      .filter((d) => d.value > 0),
  [stats]);

  function exportExcel() {
    const data = filtered.map((r) => ({
      Date: r.date,
      Student: r.student?.full_name ?? "",
      Halaqa: r.halaqa?.name ?? "",
      Status: r.status,
      "Checked in at": r.checked_in_at ?? "",
      Manual: r.is_manual ? "Yes" : "No",
      "IP": r.ip_address ?? "",
      "GPS": r.latitude != null && r.longitude != null ? `${r.latitude}, ${r.longitude}` : "",
      "User agent": r.user_agent ?? "",
      Notes: r.notes ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance-${from}_to_${to}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`Attendance report  ${from} → ${to}`, 14, 14);
    doc.setFontSize(10);
    doc.text(
      `Total: ${stats.total}   Present: ${stats.by.present}   Late: ${stats.by.late}   Absent: ${stats.by.absent}   Rate: ${stats.rate}%`,
      14,
      22,
    );
    autoTable(doc, {
      startY: 28,
      head: [["Date", "Student", "Halaqa", "Status", "Check-in", "Manual", "Notes"]],
      body: filtered.map((r) => [
        r.date,
        r.student?.full_name ?? "",
        r.halaqa?.name ?? "",
        r.status,
        r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString(lang) : "",
        r.is_manual ? "Yes" : "No",
        r.notes ?? "",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [106, 76, 147] },
    });
    doc.save(`attendance-${from}_to_${to}.pdf`);
  }

  async function saveEdit(next: { status: Status; notes: string }) {
    if (!editing) return;
    try {
      await upsert({ data: { attendanceId: editing.id, status: next.status, notes: next.notes || undefined } });
      toast.success(t("a.att.updated"));
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-4 md:p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("a.att.from")}
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm" />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {t("a.att.to")}
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm" />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {t("a.att.halaqa")}
            <select value={halaqaId} onChange={(e) => setHalaqaId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm">
              <option value="">{t("a.att.all_halaqas")}</option>
              {halaqas.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {t("common.teacher")}
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm">
              <option value="">{t("a.att.all_teachers")}</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name ?? "—"}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {t("a.att.student")}
            <input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder={t("a.att.search_name")} className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm" />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {t("common.status")}
            <select value={status} onChange={(e) => setStatus(e.target.value as Status | "")} className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm">
              <option value="">{t("common.all")}</option>
              <option value="present">{t("common.present")}</option>
              <option value="late">{t("common.late")}</option>
              <option value="absent">{t("common.absent")}</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={exportExcel} className="px-4 py-2 rounded-full bg-gold/20 text-gold-foreground border border-gold/40 text-xs font-semibold hover:bg-gold/30">📊 {t("a.att.export_excel")}</button>
          <button onClick={exportPDF} className="px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-semibold hover:bg-primary/20">📄 {t("a.att.export_pdf")}</button>
          <span className="ms-auto text-xs text-muted-foreground self-center">{t("a.att.records", { n: filtered.length })}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label={t("a.att.total")} value={stats.total} tone="from-primary/20 to-primary/5" />
        <StatCard label={t("common.present")} value={stats.by.present} tone="from-emerald-500/20 to-emerald-500/5" />
        <StatCard label={t("common.late")} value={stats.by.late} tone="from-amber-500/20 to-amber-500/5" />
        <StatCard label={t("common.absent")} value={stats.by.absent} tone="from-rose-500/20 to-rose-500/5" />
        <StatCard label={t("a.att.rate")} value={`${stats.rate}%`} tone="from-gold/20 to-gold/5" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-4 shadow-soft">
          <h3 className="text-sm font-bold text-primary mb-2">{t("a.att.daily")}</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={chartByDay}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="present" stackId="a" fill={STATUS_COLORS.present} />
                <Bar dataKey="late" stackId="a" fill={STATUS_COLORS.late} />
                <Bar dataKey="absent" stackId="a" fill={STATUS_COLORS.absent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-4 shadow-soft">
          <h3 className="text-sm font-bold text-primary mb-2">{t("a.att.distribution")}</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {pieData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name as Status]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-4 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-start py-2 px-2 font-semibold">{t("common.date")}</th>
                <th className="text-start py-2 px-2 font-semibold">{t("a.att.student")}</th>
                <th className="text-start py-2 px-2 font-semibold">{t("a.att.halaqa")}</th>
                <th className="text-start py-2 px-2 font-semibold">{t("common.status")}</th>
                <th className="text-start py-2 px-2 font-semibold">{t("a.att.checkin")}</th>
                <th className="text-start py-2 px-2 font-semibold">{t("a.att.device")}</th>
                <th className="text-start py-2 px-2 font-semibold">{t("a.att.gps")}</th>
                <th className="text-end py-2 px-2 font-semibold">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">{t("common.loading")}</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">{t("a.att.no_records")}</td></tr>}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="py-2 px-2 text-xs">{r.date}</td>
                  <td className="py-2 px-2 text-xs">{r.student?.full_name ?? "—"}</td>
                  <td className="py-2 px-2 text-xs">{r.halaqa?.name ?? "—"}</td>
                  <td className="py-2 px-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${STATUS_COLORS[r.status]}22`, color: STATUS_COLORS[r.status] }}>
                      {t(`common.${r.status}`)}
                    </span>
                    {r.is_manual && <span className="ms-1 text-[9px] text-muted-foreground">{t("a.att.manual")}</span>}
                  </td>
                  <td className="py-2 px-2 text-xs">{r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString(lang) : "—"}</td>
                  <td className="py-2 px-2 text-xs max-w-[180px] truncate" title={r.user_agent ?? ""}>{r.user_agent ? shortDevice(r.user_agent) : "—"}</td>
                  <td className="py-2 px-2 text-xs">
                    {r.latitude != null && r.longitude != null ? (
                      <a href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="text-primary underline">
                        {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="py-2 px-2 text-end">
                    <button onClick={() => setEditing(r)} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20">{t("common.edit")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditModal record={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className={`rounded-2xl border border-border p-4 bg-gradient-to-br ${tone}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-2xl font-black text-primary mt-1">{value}</div>
    </div>
  );
}

function shortDevice(ua: string) {
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux";
  return ua.slice(0, 24);
}

function EditModal({ record, onClose, onSave }: { record: Row; onClose: () => void; onSave: (v: { status: Status; notes: string }) => void }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>(record.status);
  const [notes, setNotes] = useState(record.notes ?? "");
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-border max-w-md w-full shadow-glow p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="font-bold text-primary">{t("a.att.correct_title")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{record.student?.full_name} · {record.halaqa?.name} · {record.date}</p>
        </div>
        <label className="block text-xs font-semibold text-muted-foreground">
          {t("common.status")}
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm">
            <option value="present">{t("common.present")}</option>
            <option value="late">{t("common.late")}</option>
            <option value="absent">{t("common.absent")}</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          {t("common.notes")}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm" />
        </label>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{t("common.cancel")}</button>
          <button onClick={() => onSave({ status, notes })} className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-royal text-primary-foreground">{t("common.save")}</button>
        </div>
      </div>
    </div>
  );
}