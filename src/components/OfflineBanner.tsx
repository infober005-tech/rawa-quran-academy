import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="sticky top-0 z-50 bg-destructive text-destructive-foreground text-center text-xs py-1.5 px-3">
      ⚠️ لا يوجد اتصال بالإنترنت — سيتم تحديث البيانات تلقائياً عند عودة الاتصال
    </div>
  );
}
