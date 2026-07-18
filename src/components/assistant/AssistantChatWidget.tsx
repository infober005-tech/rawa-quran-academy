import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAssistant } from "@/hooks/useAssistant";
import AssistantHeader from "./AssistantHeader";
import AssistantMessage from "./AssistantMessage";
import AssistantTyping from "./AssistantTyping";
import AssistantSuggestions from "./AssistantSuggestions";
import AssistantEmpty from "./AssistantEmpty";
import AssistantInput from "./AssistantInput";

type Props = {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
};

export default function AssistantChatWidget({ open, onClose, onMinimize }: Props) {
  const { messages, send, isSending, clear, hasAnnouncement } = useAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, isSending]);

  if (!mounted) return null;

  return (
    <div
      dir="rtl"
      aria-hidden={!open}
      className={cn(
        "fixed z-[60] transition-all duration-300 ease-out",
        "inset-x-2 bottom-2 sm:inset-x-auto sm:end-6 sm:bottom-24",
        "sm:w-[400px] sm:h-[600px]",
        "h-[80vh] max-h-[720px]",
        open
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
      role="dialog"
      aria-label="مساعد رواء"
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-primary/15 bg-background/95 backdrop-blur-xl shadow-2xl">
        <AssistantHeader
          onClose={onClose}
          onMinimize={onMinimize}
          onClear={clear}
          hasAnnouncement={hasAnnouncement}
        />
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-primary/5 to-transparent"
        >
          {messages.length === 0 && <AssistantEmpty />}
          {messages.map((m) => (
            <AssistantMessage key={m.id} message={m} />
          ))}
          {isSending && <AssistantTyping />}
        </div>
        <AssistantSuggestions onPick={(p) => send(p)} disabled={isSending} />
        <AssistantInput disabled={isSending} onSend={send} />
      </div>
    </div>
  );
}