import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export function StudentDashboard() {
  const { user, profile } = useAuth();
  const { t } = useI18n();

  const { data: assignment } = useQuery({
    queryKey: ["my-halaqa", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_halaqas")
        .select("halaqa:halaqas(id, name, level, schedule, meeting_link, teacher:profiles!halaqas_teacher_id_fkey(full_name), supervisor:profiles!halaqas_supervisor_id_fkey(full_name))")
        .eq("student_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: att } = useQuery({
    queryKey: ["my-attendance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("status, date").eq("student_id", user!.id).order("date", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const { data: evals } = useQuery({
    queryKey: ["my-evals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("evaluations").select("*").eq("student_id", user!.id).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const total = att?.length ?? 0;
  const present = att?.filter((a) => a.status === "present").length ?? 0;
  const rate = total ? Math.round((present / total) * 100) : 0;

  const halaqa = (assignment as any)?.halaqa;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t("dash.welcome")}، {profile?.full_name} 🌙</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon="🕌" label={t("dash.my_halaqa")} value={halaqa?.name ?? "—"} />
        <StatCard icon="✅" label={t("dash.attendance")} value={`${rate}%`} />
        <StatCard icon="⭐" label={t("dash.evaluations")} value={String(evals?.length ?? 0)} />
      </div>

      {halaqa ? (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">{t("dash.my_halaqa")} · {halaqa.name}</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Info label={t("common.teacher")} value={halaqa.teacher?.full_name ?? "—"} />
            <Info label={t("common.supervisor")} value={halaqa.supervisor?.full_name ?? "—"} />
            <Info label={t("common.level")} value={halaqa.level} />
            <Info label={t("auth.schedule")} value={halaqa.schedule ?? "—"} />
          </div>
          {halaqa.meeting_link && (
            <a href={halaqa.meeting_link} target="_blank" rel="noreferrer" className="inline-block mt-5 px-6 py-2.5 rounded-full bg-gradient-royal text-primary-foreground font-semibold shadow-glow">
              ▶ {t("dash.join")}
            </a>
          )}
        </div>
      ) : (
        <div className="p-10 rounded-2xl bg-card border border-dashed border-border text-center text-muted-foreground">{t("dash.no_halaqa")}</div>
      )}

      {evals && evals.length > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">{t("dash.evaluations")}</h2>
          <div className="space-y-3">
            {evals.map((e: any) => (
              <div key={e.id} className="p-3 rounded-xl bg-muted/40 text-sm grid grid-cols-2 md:grid-cols-5 gap-2">
                <div><span className="text-xs text-muted-foreground">تجويد</span><div className="font-bold text-primary">{e.tajweed_score ?? "—"}</div></div>
                <div><span className="text-xs text-muted-foreground">حفظ</span><div className="font-bold text-primary">{e.memorization_score ?? "—"}</div></div>
                <div><span className="text-xs text-muted-foreground">طلاقة</span><div className="font-bold text-primary">{e.fluency_score ?? "—"}</div></div>
                <div><span className="text-xs text-muted-foreground">مشاركة</span><div className="font-bold text-primary">{e.participation_score ?? "—"}</div></div>
                <div className="col-span-2 md:col-span-1 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</div>
                {e.notes && <div className="col-span-full text-xs text-muted-foreground">{e.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-primary mt-1">{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/40">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  );
}