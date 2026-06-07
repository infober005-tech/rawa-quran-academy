import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/halaqas")({
  component: HalaqasPage,
});

function HalaqasPage() {
  const { t } = useI18n();
  const { primaryRole } = useAuth();

  const { data } = useQuery({
    queryKey: ["halaqas-all", primaryRole],
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("*, teacher:profiles!halaqas_teacher_id_fkey(full_name), supervisor:profiles!halaqas_supervisor_id_fkey(full_name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold text-primary mb-6">{t("nav.halaqas")}</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((h: any) => (
          <div key={h.id} className="p-5 rounded-2xl bg-card border border-border shadow-soft hover:border-gold/40 transition">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-bold text-primary">{h.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{h.level} · {h.gender === "male" ? "ذكور" : "إناث"}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${h.status === "active" ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>{h.status}</span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <div>👨‍🏫 {h.teacher?.full_name ?? "—"}</div>
              <div>👁️ {h.supervisor?.full_name ?? "—"}</div>
              {h.schedule && <div>🗓️ {h.schedule}</div>}
            </div>
            {h.meeting_link && (
              <a href={h.meeting_link} target="_blank" rel="noreferrer" className="mt-4 inline-block px-4 py-1.5 rounded-full bg-gradient-royal text-primary-foreground text-xs font-semibold">▶ {t("dash.join")}</a>
            )}
          </div>
        ))}
        {(!data || data.length === 0) && <div className="md:col-span-3 p-10 text-center text-muted-foreground border border-dashed rounded-2xl">—</div>}
      </div>
    </DashboardShell>
  );
}