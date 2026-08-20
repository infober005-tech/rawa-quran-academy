import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { AssistantMessage as Msg } from "@/types/assistant";

function formatTime(ts: number, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  } catch {
    return "";
  }
}

export default function AssistantMessage({ message }: { message: Msg }) {
  const { lang } = useI18n();
  const isUser = message.role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex flex-col max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm border",
            isUser
              ? "bg-gradient-royal text-primary-foreground border-transparent rounded-br-md"
              : "bg-white/85 dark:bg-white/5 backdrop-blur text-foreground border-primary/10 rounded-bl-md",
          )}
        >
          {message.content}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((a) => (
                <span key={a.id} className="text-[10px] px-2 py-1 rounded-md bg-black/10 dark:bg-white/10">
                  {a.kind === "image" ? "🖼️" : a.kind === "pdf" ? "📄" : "🎙️"} {a.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 px-1 tabular-nums" dir="ltr">
          {formatTime(message.createdAt, lang)}
        </span>
      </div>
    </div>
  );
}