import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { ChatPage } from "@/features/chat/ChatPage";

export const Route = createFileRoute("/_authenticated/chat")({
  component: () => (
    <DashboardShell>
      <ChatPage />
    </DashboardShell>
  ),
});