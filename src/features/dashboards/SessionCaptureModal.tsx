import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Student = { id: string; full_name: string };
type AttStatus = "present" | "late" | "absent";

type RowState = {
  status: AttStatus | null;
  tajweed: string;
  memorization: string;
  behavior: string;
  notes: string;
  attSavedAt?: number;
  evalSavedAt?: number;
};

const emptyRow = (): RowState => ({
  status: null, tajweed: "", memorization: "", behavior: "", notes: "",
});

/**
 * Combined live-session capture: attendance + evaluation per student,
 * auto-linked to the open halaqa_session. Auto-saves on change.
 */
export function SessionCaptureModal({
  halaqaId, teacherId, onClose,
}: { halaqaId: string; teacherId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  // Ensure there is an open session for this halaqa; create one if none exists.
  const { data: sessionId } = useQuery({
    queryKey: ["capture-session", halaqaId],
    queryFn: async () => {
      const { data: open } = await supabase
        .from("halaqa_sessions")
        .select("id")
        .eq("halaqa_id", halaqaId)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (open?.id) return open.id as string;
      const { data: created, error } = await supabase
        .from("halaqa_sessions")
        .insert({ halaqa_id: halaqaId, started_at: new Date().toISOString(), started_by: teacherId })
        .select("id")
        .single();
      if (error) throw error;
      return created.id as string;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["capture-students", halaqaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_halaqas")
        .select("student:profiles(id, full_name)")
        .eq("halaqa_id", halaqaId);
      return (data ?? []).map((r: { student: Student }) => r.student);
    },
  });

  // Pre-load any attendance/eval already recorded for this session/day.
  const { data: existing } = useQuery({
    queryKey: ["capture-existing", halaqaId, sessionId, today],
    enabled: !!sessionId,
    queryFn: async () => {
      const [{ data: att }, { data: ev }] = await Promise.all([
        supabase.from("attendance").select("student_id, status, notes").eq("halaqa_id", halaqaId).eq("date", today),
        supabase.from("evaluations").select("student_id, tajweed_score, memorization_score, behavior_score, notes").eq("session_id", sessionId!),
      ]);
      return { att: att ?? [], ev: ev ?? [] };
    },
  });

  const [rows, setRows] = useState<Record<string, RowState>>({});

  useEffect(() => {
    if (!students) return;
    setRows((prev) => {
      const next = { ...prev };
      students.forEach((s) => { if (!next[s.id]) next[s.id] = emptyRow(); });
      existing?.att?.forEach((a) => {
        next[a.student_id] = { ...(next[a.student_id] ?? emptyRow()), status: a.status as AttStatus, notes: a.notes ?? next[a.student_id]?.notes ?? "" };
      });
      existing?.ev?.forEach((e) => {
        next[e.student_id] = {
          ...(next[e.student_id] ?? emptyRow()),
          tajweed: e.tajweed_score?.toString() ?? "",
          memorization: e.memorization_score?.toString() ?? "",
          behavior: e.behavior_score?.toString() ?? "",
          notes: e.notes ?? next[e.student_id]?.notes ?? "",
        };
      });
      return next;
    });
  }, [students, existing]);

  const saveAttendance = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: AttStatus }) => {
      const r = rows[studentId];
      const payload = {
        student_id: studentId,
        halaqa_id: halaqaId,
        date: today,
        status,
        session_id: sessionId ?? null,
        recorded_by: teacherId,
        notes: r?.notes || null,
      };
      // ── LIVE ATTENDANCE INSERT AUDIT ─────────────────────────────
      // Combined payload (attendance columns + evaluation fields the caller asked to inspect).
      const auditPayload = {
        halaqa_id: payload.halaqa_id,
        student_id: payload.student_id,
        teacher_id: teacherId, // stored on attendance as `recorded_by`
        session_id: payload.session_id,
        status: payload.status,
        tajweed_score: r?.tajweed ? Number(r.tajweed) : null,
        memorization_score: r?.memorization ? Number(r.memorization) : null,
        behavior_score: r?.behavior ? Number(r.behavior) : null,
        notes: payload.notes,
      };
      // eslint-disable-next-line no-console
      console.log("[attendance-audit] payload →", auditPayload);
      if (!payload.halaqa_id) {
        // eslint-disable-next-line no-console
        console.error("[attendance-audit] halaqa_id is NULL — prop `halaqaId` passed to SessionCaptureModal was falsy:", halaqaId);
      } else {
        const { data: hal, error: halErr } = await supabase
          .from("halaqas").select("id, name, teacher_id").eq("id", payload.halaqa_id).maybeSingle();
        if (halErr) {
          // eslint-disable-next-line no-console
          console.error("[attendance-audit] halaqas lookup error:", halErr);
        } else if (!hal) {
          // eslint-disable-next-line no-console
          console.error("[attendance-audit] MISMATCH — attendance.halaqa_id has no matching public.halaqas.id", { attendance_halaqa_id: payload.halaqa_id });
        } else {
          // eslint-disable-next-line no-console
          console.log("[attendance-audit] halaqa match ✓", { attendance_halaqa_id: payload.halaqa_id, halaqas_id: hal.id, name: hal.name, teacher_id: hal.teacher_id });
        }
      }
      // ─────────────────────────────────────────────────────────────
      const { error } = await supabase.from("attendance").upsert(payload, { onConflict: "student_id,halaqa_id,date" });
      if (error) throw error;
      return studentId;
    },
    onSuccess: (studentId) => {
      setRows((r) => ({ ...r, [studentId]: { ...r[studentId], attSavedAt: Date.now() } }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveEval = useMutation({
    mutationFn: async (studentId: string) => {
      const r = rows[studentId];
      if (!r) return;
      const t = r.tajweed ? Number(r.tajweed) : null;
      const m = r.memorization ? Number(r.memorization) : null;
      const b = r.behavior ? Number(r.behavior) : null;
      const inRange = (n: number | null) => n === null || (Number.isFinite(n) && n >= 0 && n <= 100);
      if (!inRange(t) || !inRange(m) || !inRange(b)) {
        throw new Error("يجب أن تكون جميع درجات التقييم بين 0 و100.");
      }
      const payload = {
        student_id: studentId, teacher_id: teacherId, halaqa_id: halaqaId, session_id: sessionId ?? null,
        tajweed_score: t,
        memorization_score: m,
        behavior_score: b,
        notes: r.notes || null,
      };
      // Replace any existing eval for this session+student so it stays a single row.
      if (sessionId) {
        await supabase.from("evaluations").delete().eq("session_id", sessionId).eq("student_id", studentId);
      }
      const { error } = await supabase.from("evaluations").insert(payload);
      if (error) throw error;
      return studentId;
    },
    onSuccess: (studentId) => {
      if (!studentId) return;
      setRows((r) => ({ ...r, [studentId]: { ...r[studentId], evalSavedAt: Date.now() } }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const close = () => {
    qc.invalidateQueries({ queryKey: ["my-attendance"] });
    qc.invalidateQueries({ queryKey: ["my-evals"] });
    qc.invalidateQueries({ queryKey: ["parent-child-att"] });
    qc.invalidateQueries({ queryKey: ["parent-child-evals"] });
    onClose();
  };

  const summary = useMemo(() => {
    const list = Object.values(rows);
    return {
      present: list.filter((r) => r.status === "present").length,
      late: list.filter((r) => r.status === "late").length,
      absent: list.filter((r) => r.status === "absent").length,
      total: students?.length ?? 0,
    };
  }, [rows, students]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center p-2 md:p-6" onClick={close}>
      <div className="bg-card rounded-3xl border border-border w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-glow flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gold">جلسة مباشرة</div>
            <h2 className="font-bold text-primary text-lg">الحضور والتقييم</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge tone="green">حاضر {summary.present}</Badge>
            <Badge tone="amber">متأخر {summary.late}</Badge>
            <Badge tone="red">غائب {summary.absent}</Badge>
            <Badge tone="muted">/{summary.total}</Badge>
            <button onClick={close} className="ms-2 text-muted-foreground hover:text-foreground">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-4 md:p-6 space-y-3">
          {students?.map((s) => {
            const r = rows[s.id] ?? emptyRow();
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-muted/30 p-3 md:p-4">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div className="font-semibold text-primary">{s.full_name}</div>
                  <div className="flex gap-1.5">
                    {(["present", "late", "absent"] as AttStatus[]).map((st) => {
                      const active = r.status === st;
                      const tone = st === "present" ? "green" : st === "late" ? "amber" : "red";
                      const label = st === "present" ? "حاضر" : st === "late" ? "متأخر" : "غائب";
                      return (
                        <button
                          key={st}
                          onClick={() => { setRows((p) => ({ ...p, [s.id]: { ...r, status: st } })); saveAttendance.mutate({ studentId: s.id, status: st }); }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${active ? toneBg(tone) : "bg-background border-border text-muted-foreground hover:bg-muted"}`}
                        >{label}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ScoreInput label="تجويد" value={r.tajweed} onChange={(v) => setRows((p) => ({ ...p, [s.id]: { ...r, tajweed: v } }))} onBlur={() => saveEval.mutate(s.id)} />
                  <ScoreInput label="حفظ" value={r.memorization} onChange={(v) => setRows((p) => ({ ...p, [s.id]: { ...r, memorization: v } }))} onBlur={() => saveEval.mutate(s.id)} />
                  <ScoreInput label="سلوك" value={r.behavior} onChange={(v) => setRows((p) => ({ ...p, [s.id]: { ...r, behavior: v } }))} onBlur={() => saveEval.mutate(s.id)} />
                </div>
                <textarea
                  rows={2}
                  placeholder="ملاحظات المعلم"
                  value={r.notes}
                  onChange={(e) => setRows((p) => ({ ...p, [s.id]: { ...r, notes: e.target.value } }))}
                  onBlur={() => saveEval.mutate(s.id)}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-input bg-background text-sm"
                />
                <div className="mt-1 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
                  {r.attSavedAt && <span>✓ حضور محفوظ</span>}
                  {r.evalSavedAt && <span>✓ تقييم محفوظ</span>}
                </div>
              </div>
            );
          })}
          {(!students || students.length === 0) && (
            <div className="py-12 text-center text-muted-foreground text-sm">لا يوجد طلاب في هذه الحلقة بعد.</div>
          )}
        </div>
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>التغييرات تحفظ تلقائياً وتظهر فوراً للطالب وولي الأمر.</span>
          <button onClick={close} className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-semibold">إنهاء</button>
        </div>
      </div>
    </div>
  );
}

function ScoreInput({ label, value, onChange, onBlur }: { label: string; value: string; onChange: (v: string) => void; onBlur: () => void }) {
  const clamp = (raw: string) => {
    if (raw === "") return "";
    // strip non-digits (also blocks '-', '.', 'e')
    const digits = raw.replace(/\D+/g, "");
    if (digits === "") return "";
    const n = Number(digits);
    if (!Number.isFinite(n)) return "";
    if (n < 0) return "0";
    if (n > 100) return "100";
    return String(n);
  };
  return (
    <label className="block">
      <span className="block text-[10px] text-muted-foreground mb-1">{label} (0-100)</span>
      <input
        type="number" min={0} max={100} step={1} inputMode="numeric"
        value={value}
        onChange={(e) => onChange(clamp(e.target.value))}
        onBlur={(e) => { onChange(clamp(e.target.value)); onBlur(); }}
        onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm text-center font-bold"
      />
    </label>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "red" | "muted" }) {
  return <span className={`px-2 py-1 rounded-full font-bold ${toneBg(tone)}`}>{children}</span>;
}
function toneBg(tone: string) {
  switch (tone) {
    case "green": return "bg-green-500/15 text-green-600 border-green-500/30";
    case "amber": return "bg-amber-500/15 text-amber-600 border-amber-500/30";
    case "red": return "bg-red-500/15 text-red-600 border-red-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}