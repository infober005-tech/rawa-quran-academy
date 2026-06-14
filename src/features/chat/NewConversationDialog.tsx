import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function NewConversationDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users } = useQuery({
    queryKey: ["chat-users", search],
    enabled: open,
    queryFn: async () => {
      let q = supabase.from("profiles").select("id, full_name, email, avatar_url").neq("id", user!.id).limit(30);
      if (search.trim()) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (otherId: string) => {
      // Look for existing direct conversation between the two users
      const { data: myConvs } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user!.id);
      const ids = (myConvs ?? []).map((m) => m.conversation_id);
      if (ids.length) {
        const { data: theirs } = await supabase
          .from("conversation_members")
          .select("conversation_id, conversation:conversations!inner(id, kind)")
          .eq("user_id", otherId)
          .in("conversation_id", ids);
        const existing = (theirs ?? []).find((r: any) => r.conversation?.kind === "direct");
        if (existing) return existing.conversation_id as string;
      }
      const { data: conv, error: cErr } = await supabase
        .from("conversations")
        .insert({ kind: "direct", created_by: user!.id })
        .select()
        .single();
      if (cErr) throw cErr;
      const { error: mErr } = await supabase.from("conversation_members").insert([
        { conversation_id: conv.id, user_id: user!.id },
        { conversation_id: conv.id, user_id: otherId },
      ]);
      if (mErr) throw mErr;
      return conv.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
      onCreated(id);
      onClose();
    },
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary">محادثة جديدة</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد..."
          className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border outline-none focus:border-primary"
        />
        <div className="max-h-80 overflow-y-auto space-y-1">
          {(users ?? []).map((u) => (
            <button
              key={u.id}
              disabled={create.isPending}
              onClick={() => create.mutate(u.id)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted text-start transition"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-royal text-primary-foreground flex items-center justify-center font-bold">
                {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{u.full_name || u.email}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
            </button>
          ))}
          {(users ?? []).length === 0 && <div className="text-center text-sm text-muted-foreground py-6">لا توجد نتائج</div>}
        </div>
      </div>
    </div>
  );
}