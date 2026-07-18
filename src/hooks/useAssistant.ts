import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendAssistantMessage, ASSISTANT_STORAGE_KEY } from "@/services/assistant";
import type { AssistantAttachment, AssistantMessage } from "@/types/assistant";

const WELCOME: AssistantMessage = {
  id: "welcome",
  role: "assistant",
  createdAt: Date.now(),
  content:
    "السلام عليكم ورحمة الله وبركاته 🌿\n\nأهلاً بك في منصة رواء.\nأنا مساعدك الذكي ويمكنني مساعدتك في:\n\n• التسجيل\n• الحلقات\n• المعلمين\n• الاشتراكات\n• المدفوعات\n• الحضور (QR)\n• لوحة الطالب\n• لوحة ولي الأمر\n• لوحة المعلم\n• القرآن والحفظ والتجويد\n• الدعم الفني",
};

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function useAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
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
        content: clean || "(مرفق)",
        createdAt: Date.now(),
        attachments,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);
      try {
        const history = [...messages, userMsg].filter((m) => m.id !== "welcome");
        const { reply, hasAnnouncement: ann } = await sendAssistantMessage(history);
        setHasAnnouncement(ann);
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: reply, createdAt: Date.now() },
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "خطأ غير معروف";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content:
              msg === "RATE_LIMITED"
                ? "تم تجاوز الحد المؤقت للاستخدام، حاول بعد قليل."
                : msg === "CREDITS_EXHAUSTED"
                ? "انتهى رصيد المساعد الذكي. يرجى إبلاغ الإدارة."
                : "تعذّر الاتصال بالمساعد الآن. حاول مرة أخرى.",
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [messages],
  );

  const clear = useCallback(() => {
    setMessages([{ ...WELCOME, id: "welcome", createdAt: Date.now() }]);
    setError(null);
  }, []);

  return useMemo(
    () => ({ messages, send, isSending, error, clear, hasAnnouncement }),
    [messages, send, isSending, error, clear, hasAnnouncement],
  );
}