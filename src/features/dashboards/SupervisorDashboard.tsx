import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RecordingsPanel } from "@/features/recordings/RecordingsPanel";

export function SupervisorDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [halaqaId, setHalaqaId] = useState<string | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reportsId, setReportsId] = useState<string | null>(null);

  const { data: halaqas } = useQuery({
    queryKey: ["sup-halaqas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("*, students:student_halaqas(count)").eq("supervisor_id", user!.id);
      return data ?? [];
    },
  });

  const dow = ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];
  const todays = halaqas?.filter((h: any) => Array.isArray(h.schedule_days) ? h.schedule_days.some((d: string) => d.toLowerCase().startsWith(dow)) : true) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t("common.supervisor")} · {t("dash.attendance")}</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon="🕌" label={t("sup.todays")} value={String(todays.length)} />
        <StatCard icon="📚" label={t("nav.halaqas")} value={String(halaqas?.length ?? 0)} />
        <StatCard icon="🎓" label={t("common.students")} value={String(halaqas?.reduce((a: number, h: any) => a + (h.students?.[0]?.count ?? 0), 0) ?? 0)} />
      </div>

      {todays.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-royal text-primary-foreground shadow-glow">
          <div className="text-xs uppercase tracking-wide opacity-80 mb-2">{t("sup.todays")}</div>
          <div className="flex flex-wrap gap-2">
            {todays.map((h: any) => (
              <button key={h.id} onClick={() => setHalaqaId(h.id)} className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-sm font-semibold">
                {h.name} {h.start_time && `· ${h.start_time.slice(0,5)}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {halaqas?.map((h) => (
          <div key={h.id} className={`p-5 rounded-2xl border transition ${halaqaId === h.id ? "bg-card border-gold shadow-glow" : "bg-card border-border hover:border-gold/40"}`}>
            <button onClick={() => setHalaqaId(h.id)} className="text-start w-full">
              <div className="font-bold text-primary">{h.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{h.level} · {h.schedule ?? "—"}</div>
            </button>
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              <button onClick={() => setSessionId(h.id)} className="px-2 py-1.5 rounded-lg bg-muted text-xs font-semibold hover:bg-muted/70">🎙 {t("sup.session")}</button>
              <button onClick={() => setNotesId(h.id)} className="px-2 py-1.5 rounded-lg bg-gold/20 text-gold text-xs font-semibold hover:bg-gold/30">📝 {t("sup.notes")}</button>
              <button onClick={() => setReportsId(h.id)} className="px-2 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">📊 {t("sup.report")}</button>
            </div>
          </div>
        ))}
        {(!halaqas || halaqas.length === 0) && <div className="md:col-span-3 p-10 text-center text-muted-foreground border border-dashed rounded-2xl">{t("dash.no_halaqa")}</div>}
      </div>
      {halaqaId && <AttendanceSheet halaqaId={halaqaId} />}
      {notesId && <NotesModal halaqaId={notesId} onClose={() => setNotesId(null)} />}
      {sessionId && <SessionModal halaqaId={sessionId} onClose={() => setSessionId(null)} />}
      {reportsId && <ReportModal halaqaId={reportsId} onClose={() => setReportsId(null)} />}

      {halaqas?.[0] && (
        <RecordingsPanel halaqaId={halaqas[0].id} allowModerate />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="p-5 rounded-2xl bg-card border border-border shadow-soft"><div className="text-3xl mb-2">{icon}</div><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-bold text-primary">{value}</div></div>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-card rounded-3xl border border-border ${wide ? "max-w-4xl" : "max-w-2xl"} w-full max-h-[85vh] overflow-y-auto shadow-glow`} onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
          <h2 className="font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function AttendanceSheet({ halaqaId }: { halaqaId: string }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const { data: students } = useQuery({
    queryKey: ["sup-students", halaqaId],
    queryFn: async () => {
      const { data } = await supabase.from("student_halaqas").select("student:profiles(id, full_name)").eq("halaqa_id", halaqaId);
      return (data ?? []).map((r: any) => r.student);
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["sup-att", halaqaId, date],
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("*").eq("halaqa_id", halaqaId).eq("date", date);
      return data ?? [];
    },
  });

  const mark = useMutation({
    mutationFn: async ({ studentId, status, notes }: { studentId: string; status?: "present" | "absent" | "late"; notes?: string }) => {
      const existingRow = existing?.find((a) => a.student_id === studentId);
      const payload: any = { student_id: studentId, halaqa_id: halaqaId, date, recorded_by: user!.id };
      payload.status = status ?? existingRow?.status ?? "present";
      if (notes !== undefined) payload.notes = notes;
      const { error } = await supabase.from("attendance").upsert(payload, { onConflict: "student_id,halaqa_id,date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sup-att", halaqaId, date] }),
    onError: (e: any) => toast.error(e.message),
  });

  const statusOf = (id: string) => existing?.find((a) => a.student_id === id)?.status as string | undefined;
  const noteOf = (id: string) => existing?.find((a) => a.student_id === id)?.notes as string | undefined;

  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-bold text-primary">{t("dash.attendance")}</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-1.5 rounded-xl border border-input bg-background text-sm" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr><th className="p-2 text-start">{t("common.name")}</th><th className="p-2 text-start">{t("common.status")}</th><th className="p-2 text-start">{t("common.notes")}</th></tr>
          </thead>
          <tbody>
        {students?.map((s: any) => {
          const cur = statusOf(s.id);
          return (
            <tr key={s.id} className="border-t border-border align-top">
              <td className="p-2 font-medium">{s.full_name}</td>
              <td className="p-2"><div className="flex gap-1">
                {(["present", "late", "absent"] as const).map((st) => (
                  <button key={st} onClick={() => mark.mutate({ studentId: s.id, status: st })} className={`px-3 py-1 rounded-full text-xs font-semibold transition ${cur === st ? (st === "present" ? "bg-green-500 text-white" : st === "late" ? "bg-amber-500 text-white" : "bg-red-500 text-white") : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                    {t(`common.${st}`)}
                  </button>
                ))}
              </div></td>
              <td className="p-2"><NoteInput initial={noteOf(s.id) ?? ""} onSave={(notes) => mark.mutate({ studentId: s.id, notes })} /></td>
            </tr>
          );
        })}
        {(!students || students.length === 0) && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">—</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NoteInput({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex gap-1">
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="—" className="px-2 py-1 rounded-lg border border-input bg-background text-xs w-40" />
      {v !== initial && <button onClick={() => onSave(v)} className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs">✓</button>}
    </div>
  );
}

function NotesModal({ halaqaId, onClose }: { halaqaId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState({ student_id: "", category: "follow_up" as const, note: "" });

  const { data: students } = useQuery({
    queryKey: ["sup-n-students", halaqaId],
    queryFn: async () => {
      const { data } = await supabase.from("student_halaqas").select("student:profiles(id, full_name)").eq("halaqa_id", halaqaId);
      return (data ?? []).map((r: any) => r.student);
    },
  });

  const { data: notes } = useQuery({
    queryKey: ["sup-notes", halaqaId],
    queryFn: async () => {
      const { data } = await supabase.from("supervisor_notes").select("*, student:profiles!supervisor_notes_student_id_fkey(full_name)").eq("halaqa_id", halaqaId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.student_id || !form.note.trim()) throw new Error("Required");
      const { error } = await supabase.from("supervisor_notes").insert({ halaqa_id: halaqaId, author_id: user!.id, student_id: form.student_id, category: form.category, note: form.note });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("✓"); setForm({ student_id: "", category: "follow_up", note: "" }); qc.invalidateQueries({ queryKey: ["sup-notes", halaqaId] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("supervisor_notes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sup-notes", halaqaId] }),
  });

  return (
    <Modal title={t("sup.followup_notes")} onClose={onClose} wide>
      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="px-3 py-2 rounded-xl border border-input bg-background text-sm">
            <option value="">— {t("common.students")} —</option>
            {students?.map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })} className="px-3 py-2 rounded-xl border border-input bg-background text-sm">
            <option value="behavior">{t("sup.cat.behavior")}</option>
            <option value="attendance">{t("sup.cat.attendance")}</option>
            <option value="technical">{t("sup.cat.technical")}</option>
            <option value="follow_up">{t("sup.cat.follow_up")}</option>
          </select>
        </div>
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={t("common.notes")} rows={3} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm" />
        <button onClick={() => create.mutate()} disabled={create.isPending} className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-sm font-semibold">+ {t("common.save")}</button>
      </div>
      <div className="divide-y divide-border">
        {notes?.map((n: any) => (
          <div key={n.id} className="py-3 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-primary text-sm">{n.student?.full_name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold uppercase">{t(`sup.cat.${n.category}`)}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              <div className="text-sm text-foreground">{n.note}</div>
            </div>
            {n.author_id === user!.id && <button onClick={() => del.mutate(n.id)} className="text-xs text-red-500 hover:underline">✕</button>}
          </div>
        ))}
        {(!notes || notes.length === 0) && <div className="py-6 text-center text-muted-foreground text-sm">—</div>}
      </div>
    </Modal>
  );
}

function SessionModal({ halaqaId, onClose }: { halaqaId: string; onClose: () => void }) {
  const { t } = useI18n();
  const { data: students } = useQuery({
    queryKey: ["sup-sess-students", halaqaId],
    queryFn: async () => {
      const { data } = await supabase.from("student_halaqas").select("student:profiles(id, full_name)").eq("halaqa_id", halaqaId);
      return (data ?? []).map((r: any) => r.student);
    },
  });
  const [order, setOrder] = useState<string[]>([]);
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<string[]>([]);
  const [participated, setParticipated] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (students && order.length === 0 && students.length > 0) {
      setOrder(students.map((s: any) => s.id));
    }
  }, [students, order.length]);

  const move = (id: string, dir: -1 | 1) => {
    setOrder((o) => {
      const i = o.indexOf(id); if (i < 0) return o;
      const j = i + dir; if (j < 0 || j >= o.length) return o;
      const next = [...o]; [next[i], next[j]] = [next[j], next[i]]; return next;
    });
  };
  const toggleMute = (id: string) => setMuted((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleQueue = (id: string) => setQueue((q) => q.includes(id) ? q.filter((x) => x !== id) : [...q, id]);
  const toggleParticipated = (id: string) => setParticipated((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const ordered = order.map((id) => students?.find((s: any) => s.id === id)).filter(Boolean) as any[];

  return (
    <Modal title={t("sup.session_mgmt")} onClose={onClose} wide>
      <div className="text-xs text-muted-foreground">{t("sup.session_hint")}</div>
      {queue.length > 0 && (
        <div className="p-3 rounded-xl bg-gold/15 border border-gold/40 text-sm">
          <span className="font-semibold text-gold">🎤 {t("sup.queue")}: </span>
          {queue.map((id, i) => <span key={id}>{i > 0 ? " → " : ""}{students?.find((s: any) => s.id === id)?.full_name}</span>)}
        </div>
      )}
      <div className="space-y-1.5">
        {ordered.map((s, i) => {
          const isMuted = muted.has(s.id);
          const inQueue = queue.includes(s.id);
          const did = participated.has(s.id);
          return (
            <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border">
              <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}.</span>
              <span className="flex-1 font-medium text-sm">{s.full_name}</span>
              <button onClick={() => move(s.id, -1)} className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/70">↑</button>
              <button onClick={() => move(s.id, 1)} className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/70">↓</button>
              <button onClick={() => toggleQueue(s.id)} className={`px-2 py-1 text-xs rounded font-semibold ${inQueue ? "bg-gold text-gold-foreground" : "bg-muted hover:bg-muted/70"}`}>🎤</button>
              <button onClick={() => toggleMute(s.id)} className={`px-2 py-1 text-xs rounded font-semibold ${isMuted ? "bg-red-500 text-white" : "bg-green-500/80 text-white"}`}>{isMuted ? "🔇" : "🔊"}</button>
              <button onClick={() => toggleParticipated(s.id)} className={`px-2 py-1 text-xs rounded font-semibold ${did ? "bg-green-500 text-white" : "bg-muted hover:bg-muted/70"}`}>✓</button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function ReportModal({ halaqaId, onClose }: { halaqaId: string; onClose: () => void }) {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["sup-report", halaqaId],
    queryFn: async () => {
      const [att, students] = await Promise.all([
        supabase.from("attendance").select("status, student_id").eq("halaqa_id", halaqaId),
        supabase.from("student_halaqas").select("student:profiles(id, full_name)").eq("halaqa_id", halaqaId),
      ]);
      return { att: att.data ?? [], students: (students.data ?? []).map((r: any) => r.student) };
    },
  });
  const total = data?.att.length ?? 0;
  const present = data?.att.filter((a) => a.status === "present").length ?? 0;
  const absent = data?.att.filter((a) => a.status === "absent").length ?? 0;
  const late = data?.att.filter((a) => a.status === "late").length ?? 0;
  const perStudent = (data?.students ?? []).map((s: any) => {
    const rows = data!.att.filter((a) => a.student_id === s.id);
    const p = rows.filter((r) => r.status === "present").length;
    return { name: s.full_name, total: rows.length, present: p, rate: rows.length ? Math.round((p / rows.length) * 100) : 0 };
  });
  return (
    <Modal title={t("sup.reports")} onClose={onClose} wide>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label={t("sup.attendance_rate")} value={total ? `${Math.round((present / total) * 100)}%` : "—"} />
        <Mini label={t("common.present")} value={String(present)} tone="green" />
        <Mini label={t("common.late")} value={String(late)} tone="amber" />
        <Mini label={t("common.absent")} value={String(absent)} tone="red" />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="p-2 text-start">{t("common.name")}</th><th className="p-2 text-start">{t("sup.sessions")}</th><th className="p-2 text-start">{t("common.present")}</th><th className="p-2 text-start">{t("sup.rate")}</th></tr></thead>
        <tbody>
          {perStudent.map((s) => (
            <tr key={s.name} className="border-t border-border"><td className="p-2 font-semibold">{s.name}</td><td className="p-2">{s.total}</td><td className="p-2">{s.present}</td><td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs ${s.rate >= 80 ? "bg-green-500/20 text-green-600" : s.rate >= 50 ? "bg-amber-500/20 text-amber-600" : "bg-red-500/20 text-red-600"}`}>{s.rate}%</span></td></tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "green" | "amber" | "red" }) {
  const c = tone === "green" ? "text-green-600" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-primary";
  return <div className="p-3 rounded-xl bg-muted/30 border border-border"><div className="text-xs text-muted-foreground">{label}</div><div className={`text-xl font-bold ${c}`}>{value}</div></div>;
}