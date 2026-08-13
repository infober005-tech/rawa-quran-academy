import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendAssistantMessage, ASSISTANT_STORAGE_KEY } from "@/services/assistant";
import type { AssistantAttachment, AssistantMessage } from "@/types/assistant";
import { useI18n } from "@/lib/i18n";

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function useAssistant() {
  const { t, lang } = useI18n();
  const welcome = useMemo<AssistantMessage>(
    () => ({ id: "welcome", role: "assistant", createdAt: Date.now(), content: t("asst.welcome") }),
    [t, lang],
  );
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnnouncement, setHasAnnouncement] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(ASSISTANT_STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as AssistantMessage[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(ASSISTANT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
  }, [messages]);

  const send = useCallback(
    async (text: string, attachments?: AssistantAttachment[]) => {
      const clean = text.trim();
      if (!clean && !(attachments?.length)) return;
      setError(null);
      const userMsg: AssistantMessage = {
        id: uid(),
        role: "user",
        content: clean || t("asst.attachment"),
        createdAt: Date.now(),
        attachments,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);
      try {
        const history = [...messages, userMsg].filter((m) => m.id !== "welcome");
        const { reply, hasAnnouncement: ann } = await sendAssistantMessage(history, lang);
        setHasAnnouncement(ann);
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: reply, createdAt: Date.now() },
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("asst.err.unknown");
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content:
              msg === "RATE_LIMITED"
                ? t("asst.err.rate")
                : msg === "CREDITS_EXHAUSTED"
                ? t("asst.err.credits")
                : t("asst.err.generic"),
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [messages, t, lang],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return useMemo(
    () => ({
      messages: messages.length ? messages : [welcome],
      send,
      isSending,
      error,
      clear,
      hasAnnouncement,
    }),
    [messages, welcome, send, isSending, error, clear, hasAnnouncement],
  );
}