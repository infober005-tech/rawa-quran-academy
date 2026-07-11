import { Link } from "@tanstack/react-router";
import { useSubscription, useMyPayments } from "@/hooks/use-subscription";
import { useState } from "react";
import { ReceiptPreviewDialog } from "@/components/ReceiptPreviewDialog";
import { useI18n } from "@/lib/i18n";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-500/20 text-green-600",
  pending: "bg-amber-500/20 text-amber-600",
  expired: "bg-muted text-muted-foreground",
  rejected: "bg-red-500/20 text-red-600",
  cancelled: "bg-muted text-muted-foreground",
};

export function SubscriptionPanel() {
  const { t, lang } = useI18n();
  const { subscription, isActive, daysRemaining } = useSubscription();
  const { data: payments } = useMyPayments();

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-gold/5 border border-gold/30 shadow-soft">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-primary">{t("s.panel_title")}</h2>
          <p className="text-xs text-muted-foreground mt-1">{t("s.panel_subtitle")}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[subscription?.status ?? "expired"]}`}>
          {subscription?.status === "active" ? t("s.status.active") :
           subscription?.status === "pending" ? t("s.status.pending") :
           subscription?.status === "rejected" ? t("s.status.rejected") :
           subscription?.status === "expired" ? t("s.status.expired") : t("s.status.none")}
        </span>
      </div>

      {isActive ? (
        <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
          <Stat label={t("s.start_date")} value={new Date(subscription!.start_date).toLocaleDateString(lang)} />
          <Stat label={t("s.end_date")} value={new Date(subscription!.end_date).toLocaleDateString(lang)} />
          <Stat label={t("s.days_remaining")} value={t("s.days_unit", { n: daysRemaining })} highlight />
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-card/60 mb-4 text-sm text-muted-foreground">
          {t("s.no_active_sub")}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        <Link to="/subscribe" className="px-5 py-2 rounded-full bg-gradient-royal text-primary-foreground text-sm font-semibold shadow-glow">
          {isActive ? t("sub.renew") : t("s.complete_subscription")}
        </Link>
      </div>

      {payments && payments.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-primary">{t("s.payment_history", { count: payments.length })}</summary>
          <div className="mt-3 divide-y divide-border">
            {payments.map((p) => <PaymentRow key={p.id} payment={p} />)}
          </div>
        </details>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`font-bold mt-1 ${highlight ? "text-gold text-lg" : "text-primary"}`}>{value}</div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: { id: string; amount: number; created_at: string; status: string; receipt_file_url: string; transaction_number: string } }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="py-2 flex items-center justify-between gap-3 flex-wrap text-xs">
      <div>
        <div className="font-semibold text-foreground">{payment.amount} DZD · #{payment.transaction_number}</div>
        <div className="text-muted-foreground">{new Date(payment.created_at).toLocaleString(lang)}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[payment.status]}`}>{payment.status}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-primary underline min-h-11 px-2"
          aria-label={t("s.preview_receipt")}
        >
          {t("s.preview_receipt")}
        </button>
        <ReceiptPreviewDialog
          open={open}
          onOpenChange={setOpen}
          receiptPath={payment.receipt_file_url}
          title={t("s.receipt_title", { num: payment.transaction_number })}
        />
      </div>
    </div>
  );
}
