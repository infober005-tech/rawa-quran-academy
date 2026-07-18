import { askAssistant } from "@/lib/assistant.functions";
import type { AssistantMessage } from "@/types/assistant";

export async function sendAssistantMessage(history: AssistantMessage[]): Promise<{
  reply: string;
  hasAnnouncement: boolean;
}> {
  const messages = history.map((m) => ({
    role: m.role,
    content: m.content.slice(0, 4000),
  }));
  const res = await askAssistant({ data: { messages } });
  return { reply: res.reply, hasAnnouncement: res.hasAnnouncement };
}

export const ASSISTANT_STORAGE_KEY = "rawa.assistant.history.v1";