import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
});

function EventsPage() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold text-primary mb-6">{t("nav.events")}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {data?.map((e) => (
          <div key={e.id} className="p-6 rounded-2xl bg-card border border-border shadow-soft">
            {e.category && <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold mb-2">{e.category}</span>}
            <h3 className="text-lg font-bold text-primary">{e.title}</h3>
            <div className="text-xs text-muted-foreground mt-1">{new Date(e.date).toLocaleString()}</div>
            {e.description && <p className="text-sm text-muted-foreground mt-3">{e.description}</p>}
            {e.meeting_link && <a href={e.meeting_link} target="_blank" rel="noreferrer" className="mt-4 inline-block px-4 py-1.5 rounded-full bg-gradient-royal text-primary-foreground text-xs font-semibold">▶ {t("dash.join")}</a>}
          </div>
        ))}
        {(!data || data.length === 0) && <div className="md:col-span-2 p-10 text-center text-muted-foreground border border-dashed rounded-2xl">—</div>}
      </div>
    </DashboardShell>
  );
}