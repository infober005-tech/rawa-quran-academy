import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send, Paperclip, Mic, Square } from "lucide-react";
import type { AssistantAttachment } from "@/types/assistant";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type Props = {
  disabled?: boolean;
  onSend: (text: string, attachments?: AssistantAttachment[]) => void;
};

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function AssistantInput({ disabled, onSend }: Props) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<AssistantAttachment[]>([]);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled) return;
    const text = value.trim();
    if (!text && attachments.length === 0) return;
    onSend(text, attachments.length ? attachments : undefined);
    setValue("");
    setAttachments([]);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const list: AssistantAttachment[] = [];
    for (const f of Array.from(files).slice(0, 4)) {
      const kind: AssistantAttachment["kind"] = f.type.startsWith("image/")
        ? "image"
        : f.type === "application/pdf"
        ? "pdf"
        : "audio";
      let dataUrl: string | undefined;
      if (kind === "image" && f.size < 2_000_000) {
        try { dataUrl = await fileToDataUrl(f); } catch { /* ignore */ }
      }
      list.push({ id: uid(), name: f.name, size: f.size, kind, dataUrl });
    }
    setAttachments((prev) => [...prev, ...list].slice(0, 4));
    if (fileRef.current) fileRef.current.value = "";
  };

  const toggleRecord = async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setAttachments((prev) => [
          ...prev,
          { id: uid(), name: file.name, kind: "audio" as const, size: file.size },
        ].slice(0, 4));
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      /* mic denied */
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-primary/10 bg-white/70 dark:bg-black/20 backdrop-blur px-3 py-2 shrink-0">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {attachments.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
              className="text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition"
              title={t("asst.remove_attachment")}
            >
              {a.kind === "image" ? "🖼️" : a.kind === "pdf" ? "📄" : "🎙️"} {a.name} ✕
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex items-center gap-1 shrink-0 pb-1">
          <button
            type="button"
            aria-label={t("asst.attach")}
            title={t("asst.attach")}
            onClick={() => fileRef.current?.click()}
            className="h-9 w-9 grid place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf,audio/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <button
            type="button"
            aria-label={recording ? t("asst.stop_record") : t("asst.record")}
            title={recording ? t("asst.stop_record") : t("asst.record")}
            onClick={toggleRecord}
            className={cn(
              "h-9 w-9 grid place-items-center rounded-full transition",
              recording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-primary/10 text-primary hover:bg-primary/20",
            )}
          >
            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder={t("asst.placeholder")}
          className="flex-1 resize-none max-h-32 min-h-[40px] rounded-2xl border border-primary/15 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={disabled || (!value.trim() && attachments.length === 0)}
          aria-label={t("asst.send")}
          className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-gradient-royal text-primary-foreground shadow-glow disabled:opacity-50 transition"
        >
          <Send className="h-4 w-4 rtl:-scale-x-100" />
        </button>
      </div>
    </form>
  );
}