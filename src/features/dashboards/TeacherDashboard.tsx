import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";

export function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: halaqas } = useQuery({
    queryKey: ["teacher-halaqas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("*").eq("teacher_id", user!.id);
      return data ?? [];
    },
  });

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t("common.teacher")} · {t("nav.dashboard")}</h1>
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
            <button onClick={() => setOpenId(h.id)} className="mt-4 w-full px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-sm font-semibold">
              {t("dash.evaluations")}
            </button>
          </div>
        ))}
        {(!halaqas || halaqas.length === 0) && (
          <div className="md:col-span-3 p-10 text-center text-muted-foreground border border-dashed rounded-2xl">{t("dash.no_halaqa")}</div>
        )}
      </div>

      {openId && <EvaluateHalaqa halaqaId={openId} onClose={() => { setOpenId(null); qc.invalidateQueries(); }} />}
    </div>
  );
}

function EvaluateHalaqa({ halaqaId, onClose }: { halaqaId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: students } = useQuery({
    queryKey: ["halaqa-students", halaqaId],
    queryFn: async () => {
      const { data } = await supabase.from("student_halaqas").select("student:profiles(id, full_name)").eq("halaqa_id", halaqaId);
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