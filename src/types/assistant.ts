export type AssistantRole = "user" | "assistant";

export interface AssistantAttachment {
  id: string;
  name: string;
  kind: "image" | "pdf" | "audio";
  size: number;
  dataUrl?: string;
}

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: number;
  attachments?: AssistantAttachment[];
}

export interface AssistantSuggestion {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
}