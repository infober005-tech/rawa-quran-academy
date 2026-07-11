import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useI18n } from "@/lib/i18n";

export function OfflineBanner() {
  const { online, verified } = useOnlineStatus();
  const { t } = useI18n();
  // Don't show during initial load; only after status is verified at least once
  if (!verified) return null;
  if (online) return null;
  return (
    <div className="sticky top-0 z-50 bg-destructive text-destructive-foreground text-center text-xs py-1.5 px-3">
      ⚠️ {t("common.offline")}
    </div>
  );
}
