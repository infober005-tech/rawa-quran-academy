import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { SubscriptionGate } from "@/components/SubscriptionGate";

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-regs", user?.id] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold text-primary mb-6">{t("nav.events")}</h1>
      <SubscriptionGate>
      <div className="grid md:grid-cols-2 gap-4">
        {data?.map((e) => {
          const registered = myRegs?.has(e.id);
          return (
            <div key={e.id} className="p-6 rounded-2xl bg-card border border-border shadow-soft">
              {e.cover_url && <img src={e.cover_url} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />}
              <div className="flex gap-2 flex-wrap mb-2">
                {e.event_type && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold">{e.event_type}</span>}
                {e.status === "completed" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">✓</span>}
              </div>
              <h3 className="text-lg font-bold text-primary">{e.title}</h3>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(e.date).toLocaleDateString()} {e.start_time && `· ${e.start_time}–${e.end_time ?? ""}`}
                {e.speaker && <> · 🎤 {e.speaker}</>}
              </div>
              {e.description && <p className="text-sm text-muted-foreground mt-3">{e.description}</p>}
              <div className="mt-4 flex gap-2 flex-wrap">
                {e.meeting_link && <a href={e.meeting_link} target="_blank" rel="noreferrer" className="px-4 py-1.5 rounded-full bg-gradient-royal text-primary-foreground text-xs font-semibold">▶ {t("dash.join")}</a>}
                {e.registration_required && e.status === "published" && (
                  <button onClick={() => register.mutate({ eventId: e.id, register: !registered })}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold ${registered ? "bg-muted text-muted-foreground" : "bg-gold text-primary"}`}>
                    {registered ? `✓ ${t("ev.registered_label")}` : `🎟️ ${t("ev.register")}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {(!data || data.length === 0) && <div className="md:col-span-2 p-10 text-center text-muted-foreground border border-dashed rounded-2xl">—</div>}
      </div>
      </SubscriptionGate>
    </DashboardShell>
  );
}