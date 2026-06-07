import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function GeneralSupervisorDashboard() {
  const { t } = useI18n();

  const { data: halaqas } = useQuery({
    queryKey: ["gs-halaqas"],
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("*, teacher:profiles!halaqas_teacher_id_fkey(full_name), supervisor:profiles!halaqas_supervisor_id_fkey(full_name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["gs-stats"],
    queryFn: async () => {
      const [hCount, sCount, attRows] = await Promise.all([
        supabase.from("halaqas").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("attendance").select("status").limit(1000),
      ]);
      const total = attRows.data?.length ?? 0;
      const present = attRows.data?.filter((a) => a.status === "present").length ?? 0;
      return { halaqas: hCount.count ?? 0, students: sCount.count ?? 0, rate: total ? Math.round((present / total) * 100) : 0 };
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t("nav.dashboard")}</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon="🕌" label={t("nav.halaqas")} value={String(stats?.halaqas ?? 0)} />
        <Stat icon="🎓" label={t("common.students")} value={String(stats?.students ?? 0)} />
        <Stat icon="✅" label={t("dash.attendance")} value={`${stats?.rate ?? 0}%`} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs">
            <tr><th className="p-3 text-start">{t("common.name")}</th><th className="p-3 text-start">{t("common.teacher")}</th><th className="p-3 text-start">{t("common.supervisor")}</th><th className="p-3 text-start">{t("common.level")}</th><th className="p-3 text-start">{t("common.status")}</th></tr>
          </thead>
          <tbody>
            {halaqas?.map((h: any) => (
              <tr key={h.id} className="border-t border-border">
                <td className="p-3 font-semibold text-primary">{h.name}</td>
                <td className="p-3">{h.teacher?.full_name ?? "—"}</td>
                <td className="p-3">{h.supervisor?.full_name ?? "—"}</td>
                <td className="p-3">{h.level}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">{h.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="p-5 rounded-2xl bg-card border border-border shadow-soft"><div className="text-3xl mb-2">{icon}</div><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-bold text-primary">{value}</div></div>;
}