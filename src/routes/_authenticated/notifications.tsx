import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { Bell, CheckCheck } from "lucide-react";
import { resolveNotificationRoute } from "@/lib/notification-routing";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, primaryRole } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
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
  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifs"] }),
  });
  const unread = (data ?? []).filter((n) => !n.is_read).length;

  const openNotification = (n: {
    id: string;
    title: string | null;
    content: string | null;
    link: string | null;
    is_read: boolean;
  }) => {
    if (!n.is_read) markRead.mutate(n.id);
    const target = resolveNotificationRoute(n, primaryRole);
    void navigate({ to: target as "/dashboard" });
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          title={t("nav.notifications")}
          subtitle={unread > 0 ? t("notif.unread_count", { count: unread }) : t("notif.all_caught_up")}
          badge="Inbox"
          actions={unread > 0 ? (
            <button
              onClick={() => markAllRead.mutate()}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-royal px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow min-h-11"
              aria-label={t("notif.mark_all_read")}
            >
              <CheckCheck className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t("notif.mark_all_short")}</span>
            </button>
          ) : undefined}
        />
        <div className="grid gap-2 max-w-3xl">
          {data?.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              className={`text-start w-full p-4 rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                n.is_read
                  ? "bg-card/60 border-border hover:bg-card"
                  : "bg-gold/5 border-gold/40 shadow-soft hover:border-gold"
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${n.is_read ? "bg-muted text-muted-foreground" : "bg-gradient-gold text-white shadow-gold"}`}>
                    <Bell className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-primary">{n.title}</div>
                    {n.content && <div className="text-sm text-muted-foreground mt-1 break-words">{n.content}</div>}
                  </div>
                </div>
                <time className="text-[11px] text-muted-foreground shrink-0">{new Date(n.created_at).toLocaleDateString()}</time>
              </div>
            </button>
          ))}
          {(!data || data.length === 0) && (
            <EmptyState
              variant="notifications"
              title={t("notif.empty_title")}
              description={t("notif.empty_desc")}
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}