import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import AssistantChatWidget from "./AssistantChatWidget";

const OPEN_KEY = "rawa.assistant.open";

export default function AssistantFAB() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setOpen(window.sessionStorage.getItem(OPEN_KEY) === "1");
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch { /* noop */ }
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      <AssistantChatWidget open={open} onClose={() => setOpen(false)} onMinimize={() => setOpen(false)} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("asst.close_assistant") : t("asst.open")}
        title={open ? t("asst.close_assistant") : t("asst.dialog")}
        className={cn(
          "fixed z-[70] end-4 bottom-4 sm:end-6 sm:bottom-6",
          "h-14 w-14 grid place-items-center rounded-full",
          "bg-gradient-royal text-primary-foreground shadow-glow",
          "hover:scale-105 active:scale-95 transition-transform",
          "ring-2 ring-white/40",
        )}
      >
        <span className={cn("absolute inset-0 rounded-full bg-primary/50 blur-xl -z-10 transition-opacity",
          open ? "opacity-0" : "opacity-70 animate-pulse")} />
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}