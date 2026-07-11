import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

/**
 * Subscribe to the signed-in user's notifications row inserts and surface
 * them as toasts in real time. Also invalidates the notifications query.
 */
export function useNotificationToasts() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload: { new: { title?: string; content?: string } }) => {
          const n = payload.new;
          toast(n.title ?? t("toast.new_notification"), { description: n.content ?? undefined });
          qc.invalidateQueries({ queryKey: ["notifications"] });
          qc.invalidateQueries({ queryKey: ["parent-notifs"] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc, t]);
}