import { askAssistant } from "@/lib/assistant.functions";
import { detectMessageLanguage, type DetectedLang } from "@/lib/detect-language";
import type { AssistantMessage } from "@/types/assistant";

export async function sendAssistantMessage(
  history: AssistantMessage[],
  lang: "ar" | "fr" | "en" = "ar",
): Promise<{
  reply: string;
  hasAnnouncement: boolean;
  responseLanguage: DetectedLang;
}> {
  const messages = history.map((m) => ({
    role: m.role,
    content: m.content.slice(0, 4000),
  }));
  // The response language comes from the CURRENT user message, not the UI language.
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const responseLanguage = detectMessageLanguage(lastUser?.content ?? "", lang);
  const res = await askAssistant({
    data: { messages, lang, responseLanguage },
  });
  return { reply: res.reply, hasAnnouncement: res.hasAnnouncement, responseLanguage };
}

export const ASSISTANT_STORAGE_KEY = "rawa.assistant.history.v1";
