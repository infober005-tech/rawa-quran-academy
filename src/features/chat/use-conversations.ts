import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation, MemberProfile } from "./types";

export type ConversationListItem = {
  conversation: Conversation;
  members: MemberProfile[];
  lastMessage: { body: string | null; created_at: string; sender_id: string } | null;
  unreadCount: number;
  lastReadAt: string;
};

export function useConversations(userId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ConversationListItem[]> => {
      // 1. memberships of current user
      const { data: myMemberships, error: mErr } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId!);
      if (mErr) throw mErr;
      const convIds = (myMemberships ?? []).map((m) => m.conversation_id);
      if (convIds.length === 0) return [];

      const [{ data: convs }, { data: allMembers }, { data: lastMsgs }] = await Promise.all([
        supabase.from("conversations").select("*").in("id", convIds).order("last_message_at", { ascending: false }),
        supabase
          .from("conversation_members")
          .select("conversation_id, user:profiles!conversation_members_user_id_fkey(id, full_name, email, avatar_url)")
          .in("conversation_id", convIds),
        supabase
          .from("messages")
          .select("conversation_id, sender_id, body, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const lastReadMap = new Map((myMemberships ?? []).map((m) => [m.conversation_id, m.last_read_at]));
      const membersByConv = new Map<string, MemberProfile[]>();
      (allMembers ?? []).forEach((row: any) => {
        const arr = membersByConv.get(row.conversation_id) ?? [];
        if (row.user) arr.push(row.user);
        membersByConv.set(row.conversation_id, arr);
      });
      const lastByConv = new Map<string, any>();
      (lastMsgs ?? []).forEach((m: any) => {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
      });

      return (convs ?? []).map((c: any) => {
        const lastRead = lastReadMap.get(c.id) ?? c.created_at;
        const unread = (lastMsgs ?? []).filter(
          (m: any) => m.conversation_id === c.id && m.sender_id !== userId && m.created_at > lastRead
        ).length;
        return {
          conversation: c,
          members: membersByConv.get(c.id) ?? [],
          lastMessage: lastByConv.get(c.id) ?? null,
          unreadCount: unread,
          lastReadAt: lastRead,
        };
      });
    },
  });

  // realtime: refresh on any conversation/message change for me
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`conv-list-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["conversations", userId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members", filter: `user_id=eq.${userId}` }, () => {
        qc.invalidateQueries({ queryKey: ["conversations", userId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return query;
}