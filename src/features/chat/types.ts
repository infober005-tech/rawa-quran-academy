export type Conversation = {
  id: string;
  kind: "direct" | "group" | "halaqa";
  title: string | null;
  halaqa_id: string | null;
  last_message_at: string;
  created_by: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
};

export type MemberProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};