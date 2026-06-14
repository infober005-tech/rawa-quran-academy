import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "./types";

export function useMessages(conversationId: string | null, userId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`msg-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          qc.setQueryData(["messages", conversationId], (old: Message[] | undefined) => {
            const m = payload.new as Message;
            if (!old) return [m];
            if (old.some((x) => x.id === m.id)) return old;
            return [...old, m];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  // mark as read whenever messages or conv change
  useEffect(() => {
    if (!conversationId || !userId) return;
    supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["conversations", userId] });
      });
  }, [conversationId, userId, query.data?.length, qc]);

  return query;
}