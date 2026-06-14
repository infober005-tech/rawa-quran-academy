import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useConversations, type ConversationListItem } from "./use-conversations";
import { useMessages } from "./use-messages";
import { NewConversationDialog } from "./NewConversationDialog";

function conversationLabel(item: ConversationListItem, selfId: string): string {
  if (item.conversation.title) return item.conversation.title;
  if (item.conversation.kind === "halaqa") return "حلقة";
  const others = item.members.filter((m) => m.id !== selfId);
  if (others.length === 0) return "محادثة";
  if (others.length === 1) return others[0].full_name || others[0].email || "مستخدم";
  return others.map((o) => o.full_name || o.email || "—").join("، ");
}

function Initial({ name }: { name: string }) {
  return (
    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-royal text-primary-foreground flex items-center justify-center font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `${m}د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}س`;
  return d.toLocaleDateString("ar");
}

export function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useConversations(user?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // auto-select first conversation
  useEffect(() => {
    if (!selectedId && list.length > 0) setSelectedId(list[0].conversation.id);
  }, [list, selectedId]);

  const selected = useMemo(() => list.find((c) => c.conversation.id === selectedId) ?? null, [list, selectedId]);
  const { data: messages = [] } = useMessages(selectedId, user?.id);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, selectedId]);

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!selectedId || !user) return;
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedId,
        sender_id: user.id,
        body,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v || !selectedId) return;
    sendMutation.mutate(v);
  };

  return (
    <div className="h-[calc(100vh-9rem)] lg:h-[calc(100vh-7rem)] grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
      {/* Conversation list */}
      <aside className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-primary">المحادثات</h2>
          <button
            onClick={() => setDialogOpen(true)}
            className="px-3 py-1.5 rounded-full bg-gradient-royal text-primary-foreground text-xs font-semibold shadow-glow"
          >
            + جديد
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">جارٍ التحميل...</div>}
          {!isLoading && list.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              لا توجد محادثات بعد. ابدأ محادثة جديدة.
            </div>
          )}
          {list.map((item) => {
            const label = conversationLabel(item, user?.id ?? "");
            const active = item.conversation.id === selectedId;
            return (
              <button
                key={item.conversation.id}
                onClick={() => setSelectedId(item.conversation.id)}
                className={`w-full flex items-center gap-3 p-3 text-start border-b border-border/50 transition ${
                  active ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <Initial name={label} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate text-sm">{label}</div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(item.conversation.last_message_at)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground truncate">
                      {item.lastMessage?.body ?? (item.lastMessage?.body === null && item.lastMessage ? "📎 مرفق" : "—")}
                    </div>
                    {item.unreadCount > 0 && (
                      <span className="bg-gold text-background text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0">
                        {item.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Message thread */}
      <section className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 grid place-items-center text-muted-foreground text-sm">اختر محادثة لبدء التواصل</div>
        ) : (
          <>
            <header className="p-4 border-b border-border flex items-center gap-3">
              <Initial name={conversationLabel(selected, user?.id ?? "")} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{conversationLabel(selected, user?.id ?? "")}</div>
                <div className="text-[11px] text-muted-foreground">
                  {selected.members.length} {selected.members.length === 1 ? "عضو" : "أعضاء"}
                </div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                const sender = selected.members.find((s) => s.id === m.sender_id);
                return (
                  <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    {!mine && <Initial name={sender?.full_name || sender?.email || "?"} />}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                        mine ? "bg-gradient-royal text-primary-foreground" : "bg-card border border-border"
                      }`}
                    >
                      {!mine && (
                        <div className="text-[10px] font-semibold text-gold mb-0.5">
                          {sender?.full_name || sender?.email || "—"}
                        </div>
                      )}
                      {m.body && <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>}
                      {m.attachment_url && (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer" className="text-xs underline mt-1 block">
                          📎 {m.attachment_name || "مرفق"}
                        </a>
                      )}
                      <div className={`text-[9px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                        {mine && m.created_at <= selected.lastReadAt && " ✓✓"}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-12">ابدأ المحادثة الآن</div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2 bg-card/80">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="اكتب رسالتك..."
                className="flex-1 px-4 py-2.5 rounded-full bg-muted/50 border border-border outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sendMutation.isPending}
                className="px-5 py-2.5 rounded-full bg-gradient-royal text-primary-foreground font-semibold shadow-glow disabled:opacity-50"
              >
                إرسال
              </button>
            </form>
          </>
        )}
      </section>

      <NewConversationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreated={(id) => setSelectedId(id)} />
    </div>
  );
}