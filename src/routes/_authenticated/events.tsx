import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { Play, Ticket, CalendarDays, Mic } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
});

function EventsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["events-public"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").in("status", ["published", "completed"]).order("date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: myRegs } = useQuery({
    queryKey: ["my-regs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("event_registrations").select("event_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r: { event_id: string }) => r.event_id));
    },
  });

  const register = useMutation({
    mutationFn: async ({ eventId, register }: { eventId: string; register: boolean }) => {
      if (register) {
        const { error } = await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_registrations").delete().eq("event_id", eventId).eq("user_id", user!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-regs", user?.id] }); toast.success(t("f.events.registered_toast")); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          title={t("nav.events")}
          subtitle={t("f.events.subtitle")}
          badge={t("f.events.badge", { count: data?.length ?? 0 })}
        />
        <SubscriptionGate>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.map((e) => {
              const registered = myRegs?.has(e.id);
              return (
                <article key={e.id} className="group relative overflow-hidden rounded-3xl bg-card/70 backdrop-blur-xl border border-border shadow-soft transition hover:border-gold/40 hover:shadow-premium">
                  {e.cover_url ? (
                    <img src={e.cover_url} alt="" loading="lazy" className="w-full aspect-[16/9] object-cover" />
                  ) : (
                    <div className="w-full aspect-[16/9] bg-gradient-royal grid place-items-center">
                      <CalendarDays className="h-10 w-10 text-white/70" aria-hidden />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex gap-2 flex-wrap mb-2">
                      {e.event_type && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold font-semibold">{e.event_type}</span>}
                      {e.status === "completed" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t("f.events.completed")}</span>}
                    </div>
                    <h2 className="text-lg font-bold text-primary leading-snug">{e.title}</h2>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{new Date(e.date).toLocaleDateString()} {e.start_time && `· ${e.start_time}${e.end_time ? `–${e.end_time}` : ""}`}</span>
                      {e.speaker && <span className="inline-flex items-center gap-1"><Mic className="h-3.5 w-3.5" aria-hidden />{e.speaker}</span>}
                    </div>
                    {e.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{e.description}</p>}
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {e.meeting_link && (
                        <a href={e.meeting_link} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-semibold shadow-glow min-h-11"
                          aria-label={`${t("dash.join")} — ${e.title}`}>
                          <Play className="h-3.5 w-3.5" aria-hidden /> {t("dash.join")}
                        </a>
                      )}
                      {e.registration_required && e.status === "published" && (
                        <button
                          onClick={() => register.mutate({ eventId: e.id, register: !registered })}
                          aria-pressed={registered}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold min-h-11 transition ${registered ? "bg-muted text-muted-foreground border border-border" : "bg-gold text-primary shadow-gold hover:brightness-105"}`}
                        >
                          <Ticket className="h-3.5 w-3.5" aria-hidden />
                          {registered ? t("ev.registered_label") : t("ev.register")}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            {(!data || data.length === 0) && (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState
                  variant="events"
                  title={t("f.events.empty_title")}
                  description={t("f.events.empty_desc")}
                />
              </div>
            )}
          </div>
        </SubscriptionGate>
      </div>
    </DashboardShell>
  );
}