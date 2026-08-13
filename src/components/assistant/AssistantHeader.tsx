import { X, Trash2, Minus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AssistantHeader({
  onClose,
  onMinimize,
  onClear,
  hasAnnouncement,
}: {
  onClose: () => void;
  onMinimize: () => void;
  onClear: () => void;
  hasAnnouncement?: boolean;
}) {
  const { t } = useI18n();
  return (
    <header className="relative px-4 py-3 bg-gradient-royal text-primary-foreground shrink-0">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur text-lg">
          🤖
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold truncate">{t("asst.title")}</h2>
          <p className="text-[11px] opacity-90 truncate">
            {t("asst.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" aria-label={t("asst.clear")} title={t("asst.clear")} onClick={onClear}
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/15 transition">
            <Trash2 className="h-4 w-4" />
          </button>
          <button type="button" aria-label={t("asst.minimize")} title={t("asst.minimize")} onClick={onMinimize}
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/15 transition">
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" aria-label={t("asst.close")} title={t("asst.close")} onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/15 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {hasAnnouncement && (
        <div className="mt-2 text-[11px] bg-amber-300/25 border border-amber-100/30 rounded-lg px-2 py-1">
          {t("asst.announcement")}
        </div>
      )}
    </header>
  );
}