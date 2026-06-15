import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to postgres changes on a set of tables and invalidate
 * the given React Query key prefixes on any change. One channel per mount.
 */
export function useRealtimeInvalidate(
  tables: string[],
  invalidatePrefixes: (string | undefined | null)[],
) {
  const qc = useQueryClient();
  const channelKey = tables.join(",");
  const keys = invalidatePrefixes.filter(Boolean).join("|");
  useEffect(() => {
    const ch = supabase.channel(`rt:${channelKey}:${keys}`);
    tables.forEach((table) => {
      ch.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table },
        () => {
          invalidatePrefixes.forEach((p) => {
            if (p) qc.invalidateQueries({ queryKey: [p] });
          });
        },
      );
    });
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelKey, keys]);
}