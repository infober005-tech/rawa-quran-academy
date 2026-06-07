import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";

export function SupervisorDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [halaqaId, setHalaqaId] = useState<string | null>(null);

  const { data: halaqas } = useQuery({
    queryKey: ["sup-halaqas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("*").eq("supervisor_id", user!.id);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t("common.supervisor")} · {t("dash.attendance")}</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {halaqas?.map((h) => (
          <button key={h.id} onClick={() => setHalaqaId(h.id)} className={`text-start p-5 rounded-2xl border transition ${halaqaId === h.id ? "bg-gradient-royal text-primary-foreground border-transparent shadow-glow" : "bg-card border-border hover:border-gold/40"}`}>
            <div className="font-bold">{h.name}</div>
            <div className="text-xs opacity-80 mt-1">{h.level} · {h.schedule}</div>
          </button>
        ))}
        {(!halaqas || halaqas.length === 0) && <div className="md:col-span-3 p-10 text-center text-muted-foreground border border-dashed rounded-2xl">{t("dash.no_halaqa")}</div>}
      </div>
      {halaqaId && <AttendanceSheet halaqaId={halaqaId} />}
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
    mutationFn: async ({ studentId, status }: { studentId: string; status: "present" | "absent" | "late" }) => {
      const { error } = await supabase.from("attendance").upsert({ student_id: studentId, halaqa_id: halaqaId, date, status, recorded_by: user!.id }, { onConflict: "student_id,halaqa_id,date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sup-att", halaqaId, date] }),
    onError: (e: any) => toast.error(e.message),
  });

  const statusOf = (id: string) => existing?.find((a) => a.student_id === id)?.status as string | undefined;

  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-bold text-primary">{t("dash.attendance")}</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-1.5 rounded-xl border border-input bg-background text-sm" />
      </div>
      <div className="divide-y divide-border">
        {students?.map((s: any) => {
          const cur = statusOf(s.id);
          return (
            <div key={s.id} className="py-3 flex items-center justify-between gap-3">
              <div className="font-medium">{s.full_name}</div>
              <div className="flex gap-1">
                {(["present", "late", "absent"] as const).map((st) => (
                  <button key={st} onClick={() => mark.mutate({ studentId: s.id, status: st })} className={`px-3 py-1 rounded-full text-xs font-semibold transition ${cur === st ? (st === "present" ? "bg-green-500 text-white" : st === "late" ? "bg-amber-500 text-white" : "bg-red-500 text-white") : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                    {t(`common.${st}`)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {(!students || students.length === 0) && <div className="py-6 text-center text-muted-foreground">—</div>}
      </div>
    </div>
  );
}