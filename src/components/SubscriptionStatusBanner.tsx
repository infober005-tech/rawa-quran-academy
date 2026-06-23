import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useTranslation } from "@/lib/i18n";

export function SubscriptionStatusBanner() {
  const { primaryRole } = useAuth();
  const { isActive, daysRemaining, loading } = useSubscription();
  const { t } = useTranslation();
  if (loading || primaryRole !== "student") return null;

  if (isActive) {
    return (
      <div
        role="status"
        className="flex items-center justify-between gap-3 rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
          <span aria-hidden>✅</span>
          <span>{t("sub.active")}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {daysRemaining} {t("sub.days_left")}
        </span>
        <Link to="/payment-status" className="text-[11px] underline text-green-700 dark:text-green-400">
          {t("sub.status_link") || "تفاصيل الحالة"}
        </Link>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent px-4 py-3 text-sm"
    >
      <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
        <span aria-hidden>⛔</span>
        <span>{t("sub.expired")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/payment-status" className="text-[11px] underline text-red-700 dark:text-red-400">
          {t("sub.status_link") || "تفاصيل الحالة"}
        </Link>
        <Link
          to="/subscribe"
          className="inline-flex items-center gap-1 rounded-full bg-gradient-royal px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-soft hover:scale-[1.02] transition"
        >
          {t("sub.renew")} ←
        </Link>
      </div>
    </div>
  );
}