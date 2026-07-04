import { Link } from "@tanstack/react-router";
import { useSubscription, useMyPayments } from "@/hooks/use-subscription";
import { useState } from "react";
import { ReceiptPreviewDialog } from "@/components/ReceiptPreviewDialog";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-500/20 text-green-600",
  pending: "bg-amber-500/20 text-amber-600",
  expired: "bg-muted text-muted-foreground",
  rejected: "bg-red-500/20 text-red-600",
  cancelled: "bg-muted text-muted-foreground",
};

export function SubscriptionPanel() {
  const { subscription, isActive, daysRemaining } = useSubscription();
  const { data: payments } = useMyPayments();

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-gold/5 border border-gold/30 shadow-soft">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-primary">💎 اشتراك رواء</h2>
          <p className="text-xs text-muted-foreground mt-1">حالة اشتراكك في المنصة</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[subscription?.status ?? "expired"]}`}>
          {subscription?.status === "active" ? "نشط" :
           subscription?.status === "pending" ? "قيد المراجعة" :
           subscription?.status === "rejected" ? "مرفوض" :
           subscription?.status === "expired" ? "منتهي" : "غير مشترك"}
        </span>
      </div>

      {isActive ? (
        <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
          <Stat label="تاريخ البدء" value={new Date(subscription!.start_date).toLocaleDateString("ar")} />
          <Stat label="تاريخ الانتهاء" value={new Date(subscription!.end_date).toLocaleDateString("ar")} />
          <Stat label="الأيام المتبقية" value={`${daysRemaining} يوم`} highlight />
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-card/60 mb-4 text-sm text-muted-foreground">
          ليس لديك اشتراك نشط. قم بالاشتراك للوصول إلى كامل خدمات المنصة.
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        <Link to="/subscribe" className="px-5 py-2 rounded-full bg-gradient-royal text-primary-foreground text-sm font-semibold shadow-glow">
          {isActive ? "تجديد الاشتراك" : "إتمام الاشتراك"}
        </Link>
      </div>

      {payments && payments.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-primary">سجل المدفوعات ({payments.length})</summary>
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
  const [open, setOpen] = useState(false);
  return (
    <div className="py-2 flex items-center justify-between gap-3 flex-wrap text-xs">
      <div>
        <div className="font-semibold text-foreground">{payment.amount} DZD · #{payment.transaction_number}</div>
        <div className="text-muted-foreground">{new Date(payment.created_at).toLocaleString("ar")}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[payment.status]}`}>{payment.status}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-primary underline min-h-11 px-2"
          aria-label="معاينة الوصل"
        >
          معاينة الوصل
        </button>
        <ReceiptPreviewDialog
          open={open}
          onOpenChange={setOpen}
          receiptPath={payment.receipt_file_url}
          title={`وصل · #${payment.transaction_number}`}
        />
      </div>
    </div>
  );
}