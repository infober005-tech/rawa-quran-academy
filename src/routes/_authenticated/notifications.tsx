import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const markRead = useMutation({
    mutationFn: async (id: string) => { await supabase.from("notifications").update({ is_read: true }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifs"] }),
  });

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold text-primary mb-6">{t("nav.notifications")}</h1>
      <div className="space-y-2">
        {data?.map((n) => (
          <div key={n.id} onClick={() => !n.is_read && markRead.mutate(n.id)} className={`p-4 rounded-2xl border cursor-pointer transition ${n.is_read ? "bg-card border-border" : "bg-gold/5 border-gold/30"}`}>
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-semibold text-primary">{n.title}</div>
                {n.content && <div className="text-sm text-muted-foreground mt-1">{n.content}</div>}
              </div>
              <div className="text-xs text-muted-foreground shrink-0">{new Date(n.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="p-10 text-center text-muted-foreground border border-dashed rounded-2xl">—</div>}
      </div>
    </DashboardShell>
  );
}