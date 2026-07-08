import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import { SessionCaptureModal } from "./SessionCaptureModal";
import { RecordingsPanel } from "@/features/recordings/RecordingsPanel";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { auditEmbeddedHalaqaRelations, selectOrThrow } from "@/lib/halaqa-query-audit";

export function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: halaqas } = useQuery({
    queryKey: ["teacher-halaqas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      await auditEmbeddedHalaqaRelations(supabase, "teacher-halaqas");
      return await selectOrThrow<any[]>(
        "teacher-halaqas",
        "halaqas",
        "*",
        supabase.from("halaqas").select("*").eq("teacher_id", user!.id),
        `where teacher_id = ${user!.id}`,
      ) ?? [];
    },
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [homeworkId, setHomeworkId] = useState<string | null>(null);
  const [studentsId, setStudentsId] = useState<string | null>(null);

  const startSession = useMutation({
    mutationFn: async (h: { id: string; meeting_link: string | null }) => {
      const { error } = await supabase.from("halaqas").update({
        live_session_active: true,
        live_session_started_at: new Date().toISOString(),
        live_session_started_by: user!.id,
      }).eq("id", h.id);
      if (error) throw error;
      await supabase.from("halaqa_sessions").insert({
        halaqa_id: h.id, started_at: new Date().toISOString(), started_by: user!.id,
      });
      if (h.meeting_link) window.open(h.meeting_link, "_blank", "noopener");
    },
    onSuccess: () => { toast.success("Live session started"); qc.invalidateQueries({ queryKey: ["teacher-halaqas"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const endSession = useMutation({
    mutationFn: async (halaqaId: string) => {
      const { error } = await supabase.from("halaqas").update({ live_session_active: false }).eq("id", halaqaId);
      if (error) throw error;
      const { data: open } = await supabase.from("halaqa_sessions")
        .select("id").eq("halaqa_id", halaqaId).is("ended_at", null)
        .order("started_at", { ascending: false }).limit(1).maybeSingle();
      if (open) await supabase.from("halaqa_sessions").update({ ended_at: new Date().toISOString() }).eq("id", open.id);
    },
    onSuccess: () => { toast.success("Session ended"); qc.invalidateQueries({ queryKey: ["teacher-halaqas"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        badge="Teacher · Halaqat"
        title={`${t("common.teacher")} · ${t("nav.dashboard")}`}
        subtitle="Manage your halaqas, students and live sessions"
        actions={
          halaqas && halaqas.some((h) => h.live_session_active) ? (
            <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-600 text-xs font-bold animate-pulse">● LIVE</span>
          ) : null
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon="🕌" label="Halaqas" value={String(halaqas?.length ?? 0)} />
        <StatTile icon="🟢" label="Active" value={String(halaqas?.filter((h) => h.status === "active").length ?? 0)} />
        <StatTile icon="🎙" label="Live now" value={String(halaqas?.filter((h) => h.live_session_active).length ?? 0)} />
        <StatTile icon="📅" label="With link" value={String(halaqas?.filter((h) => !!h.meeting_link).length ?? 0)} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {halaqas?.map((h) => (
          <div key={h.id} className="p-5 rounded-2xl bg-card border border-border shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold text-primary">{h.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{h.level} · {h.gender}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${h.status === "active" ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>{h.status}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-3">{h.schedule}</div>
            <div className="mt-3">
              {h.live_session_active ? (
                <div className="flex gap-2">
                  <a href={h.meeting_link ?? "#"} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 rounded-xl bg-green-500/20 text-green-600 text-xs font-bold text-center animate-pulse">● LIVE — Open</a>
                  <button onClick={() => endSession.mutate(h.id)} className="px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">End</button>
                </div>
              ) : (
                <button
                  disabled={!h.meeting_link || startSession.isPending}
                  onClick={() => startSession.mutate({ id: h.id, meeting_link: h.meeting_link })}
                  className="w-full px-3 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-xs font-semibold disabled:opacity-50"
                  title={!h.meeting_link ? "Set a meeting link first (Director)" : ""}
                >
                  ▶ Start live session
                </button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              <button onClick={() => setStudentsId(h.id)} className="px-2 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/70">👥 Students</button>
              <button onClick={() => setOpenId(h.id)} className="px-2 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-xs font-semibold">⭐ Evaluate</button>
              <button onClick={() => setHomeworkId(h.id)} className="px-2 py-2 rounded-xl bg-gold/20 text-gold text-xs font-semibold hover:bg-gold/30">📝 Homework</button>
            </div>
          </div>
        ))}
        {(!halaqas || halaqas.length === 0) && (
          <div className="md:col-span-3">
            <EmptyState
              variant="halaqas"
              title="No halaqas assigned yet"
              description="Once the director assigns you a halaqa, you'll be able to evaluate students, manage homework and start live sessions from here."
            />
          </div>
        )}
      </div>

      {openId && <SessionCaptureModal halaqaId={openId} teacherId={user!.id} onClose={() => { setOpenId(null); qc.invalidateQueries(); }} />}
      {studentsId && <StudentsModal halaqaId={studentsId} onClose={() => setStudentsId(null)} />}
      {homeworkId && <HomeworkModal halaqaId={homeworkId} onClose={() => { setHomeworkId(null); qc.invalidateQueries(); }} />}

      {halaqas?.[0] && (
        <RecordingsPanel halaqaId={halaqas[0].id} allowUpload allowModerate={false} />
      )}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border shadow-soft hover:shadow-premium transition">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-black text-primary mt-0.5">{value}</div>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-border max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function StudentsModal({ halaqaId, onClose }: { halaqaId: string; onClose: () => void }) {
  const { data: students } = useQuery({
    queryKey: ["t-students", halaqaId],
    queryFn: async () => {
      const data = await selectOrThrow<Array<{ student: any }>>(
        "teacher-students",
        "student_halaqas",
        "student:profiles(id, full_name, email, phone, gender, age)",
        supabase.from("student_halaqas").select("student:profiles(id, full_name, email, phone, gender, age)").eq("halaqa_id", halaqaId),
        `where halaqa_id = ${halaqaId}`,
      );
      return (data ?? []).map((r: any) => r.student);
    },
  });
  return (
    <ModalShell title="Students" onClose={onClose}>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="p-2 text-start">Name</th><th className="p-2 text-start">Email</th><th className="p-2 text-start">Age</th><th className="p-2 text-start">Phone</th></tr></thead>
        <tbody>
          {students?.map((s: any) => (
            <tr key={s.id} className="border-t border-border"><td className="p-2 font-semibold">{s.full_name}</td><td className="p-2 text-xs">{s.email}</td><td className="p-2">{s.age ?? "—"}</td><td className="p-2 text-xs">{s.phone ?? "—"}</td></tr>
          ))}
          {(!students || students.length === 0) && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">—</td></tr>}
        </tbody>
      </table>
    </ModalShell>
  );
}

function HomeworkModal({ halaqaId, onClose }: { halaqaId: string; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", due_date: "" });

  const { data: list } = useQuery({
    queryKey: ["t-homework", halaqaId],
    queryFn: async () => {
      const { data } = await supabase.from("assignments").select("*").eq("halaqa_id", halaqaId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("assignments").insert({ halaqa_id: halaqaId, teacher_id: user!.id, title: form.title, description: form.description || null, due_date: form.due_date || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("✓"); setForm({ title: "", description: "", due_date: "" }); qc.invalidateQueries({ queryKey: ["t-homework", halaqaId] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("assignments").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["t-homework", halaqaId] }),
  });

  return (
    <ModalShell title="Homework" onClose={onClose}>
      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm" />
        <div className="flex gap-2">
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="px-3 py-2 rounded-xl border border-input bg-background text-sm" />
          <button onClick={() => create.mutate()} disabled={create.isPending} className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-sm font-semibold">+ Add</button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {list?.map((h: any) => (
          <div key={h.id} className="py-3 flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-primary">{h.title}</div>
              {h.description && <div className="text-xs text-muted-foreground mt-1">{h.description}</div>}
              {h.due_date && <div className="text-xs text-gold mt-1">Due: {h.due_date}</div>}
            </div>
            <button onClick={() => del.mutate(h.id)} className="text-xs text-red-500 hover:underline">Delete</button>
          </div>
        ))}
        {(!list || list.length === 0) && <div className="py-6 text-center text-muted-foreground text-sm">No homework yet</div>}
      </div>
    </ModalShell>
  );
}

function EvaluateHalaqa({ halaqaId, onClose }: { halaqaId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: students } = useQuery({
    queryKey: ["halaqa-students", halaqaId],
    queryFn: async () => {
      const data = await selectOrThrow<Array<{ student: any }>>(
        "teacher-evaluation-students",
        "student_halaqas",
        "student:profiles(id, full_name)",
        supabase.from("student_halaqas").select("student:profiles(id, full_name)").eq("halaqa_id", halaqaId),
        `where halaqa_id = ${halaqaId}`,
      );
      return (data ?? []).map((r: any) => r.student);
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-border max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="font-bold text-primary">{t("dash.evaluations")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {students?.map((s: any) => <StudentEvalRow key={s.id} student={s} halaqaId={halaqaId} teacherId={user!.id} />)}
          {(!students || students.length === 0) && <div className="text-center text-muted-foreground py-6">—</div>}
        </div>
      </div>
    </div>
  );
}

function StudentEvalRow({ student, halaqaId, teacherId }: { student: { id: string; full_name: string }; halaqaId: string; teacherId: string }) {
  const { t } = useI18n();
  const [scores, setScores] = useState({ tajweed_score: "", memorization_score: "", fluency_score: "", participation_score: "", notes: "" });
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("evaluations").insert({
        student_id: student.id, teacher_id: teacherId, halaqa_id: halaqaId,
        tajweed_score: scores.tajweed_score ? Number(scores.tajweed_score) : null,
        memorization_score: scores.memorization_score ? Number(scores.memorization_score) : null,
        fluency_score: scores.fluency_score ? Number(scores.fluency_score) : null,
        participation_score: scores.participation_score ? Number(scores.participation_score) : null,
        notes: scores.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("✓"); setScores({ tajweed_score: "", memorization_score: "", fluency_score: "", participation_score: "", notes: "" }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="p-4 rounded-2xl bg-muted/40 border border-border">
      <div className="font-semibold text-primary mb-3">{student.full_name}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(["tajweed_score", "memorization_score", "fluency_score", "participation_score"] as const).map((k) => (
          <input key={k} type="number" min={0} max={100} placeholder={k.replace("_score","")} value={scores[k]} onChange={(e) => setScores((s) => ({ ...s, [k]: e.target.value }))} className="px-3 py-2 rounded-xl border border-input bg-background text-sm" />
        ))}
      </div>
      <textarea placeholder={t("common.notes")} value={scores.notes} onChange={(e) => setScores((s) => ({ ...s, notes: e.target.value }))} className="mt-2 w-full px-3 py-2 rounded-xl border border-input bg-background text-sm" rows={2} />
      <button onClick={() => m.mutate()} disabled={m.isPending} className="mt-2 px-4 py-1.5 rounded-full bg-gradient-royal text-primary-foreground text-sm font-semibold">{t("common.save")}</button>
    </div>
  );
}