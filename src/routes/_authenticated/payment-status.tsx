import { createFileRoute, Link } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMyPayments, useSubscription } from "@/hooks/use-subscription";
import { DashboardShell } from "@/components/DashboardShell";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/payment-status")({
  component: PaymentStatusGate,
});

type StatusKey = "pending" | "approved" | "rejected" | "expired" | "none";

function PaymentStatusGate() {
  const { primaryRole, loading } = useAuth();
  if (loading) return null;
  if (primaryRole !== "student") return <Navigate to="/dashboard" />;
  return <PaymentStatusPage />;
}

function PaymentStatusPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: payments } = useMyPayments();
  const { subscription, isActive, daysRemaining } = useSubscription();
  const last = payments?.[0];

  // Realtime: refetch on any change to my payments / subscriptions
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`payment-status-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `student_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["my-payments", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `student_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["subscription", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const status: StatusKey = useMemo(() => {
    if (subscription?.status === "expired" || (subscription && new Date(subscription.end_date) < new Date() && subscription.status !== "active")) return "expired";
    if (!last) return "none";
    if (last.status === "approved" && isActive) return "approved";
    if (last.status === "rejected") return "rejected";
    return "pending";
  }, [last, subscription, isActive]);

  const meta = STATUS_META[status];

  return (
    <DashboardShell>
      <div className="space-y-6" dir="rtl">
        <DashboardHeader title="حالة الدفع" subtitle="Payment status · live" badge="Realtime" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl border p-8 shadow-soft ${meta.card}`}
        >
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl" style={{ background: meta.glow }} />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-5xl mb-3" aria-hidden>{meta.icon}</div>
              <h2 className="text-2xl font-bold">{meta.title}</h2>
              <p className="text-sm opacity-80 mt-1 max-w-md">{meta.subtitle}</p>
              {status === "rejected" && last?.admin_notes && (
                <p className="mt-3 text-sm rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-700 dark:text-red-300">
                  <strong>السبب:</strong> {last.admin_notes}
                </p>
              )}
              {status === "approved" && subscription && (
                <p className="mt-3 text-sm">
                  اشتراكك صالح حتى <strong>{new Date(subscription.end_date).toLocaleDateString("ar")}</strong>
                  {" · "}{daysRemaining} يوم متبقي
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {(status === "rejected" || status === "expired" || status === "none") && (
                <Link to="/subscribe" className="px-5 py-2.5 rounded-full bg-gradient-royal text-primary-foreground font-bold text-sm shadow-glow">
                  {status === "expired" ? "تجديد الاشتراك" : "إتمام الدفع"} ←
                </Link>
              )}
              {status === "approved" && (
                <Link to="/dashboard" className="px-5 py-2.5 rounded-full bg-gold text-primary font-bold text-sm">إلى اللوحة ←</Link>
              )}
            </div>
          </div>
        </motion.div>

        <Timeline payment={last} status={status} />

        {last && (
          <div className="p-5 rounded-2xl bg-card border border-border text-sm space-y-2">
            <h3 className="font-bold text-primary mb-2">تفاصيل آخر طلب</h3>
            <Row k="المرجع" v={last.payment_ref ?? "—"} mono />
            <Row k="المبلغ" v={`${last.amount} DZD`} />
            <Row k="رقم العملية" v={last.transaction_number} mono />
            <Row k="تاريخ الدفع" v={new Date(last.payment_date).toLocaleDateString("ar")} />
            <Row k="أُرسل في" v={new Date(last.created_at).toLocaleString("ar")} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

const STATUS_META: Record<StatusKey, { icon: string; title: string; subtitle: string; card: string; glow: string }> = {
  pending: { icon: "⏳", title: "قيد المراجعة", subtitle: "تم استلام طلبك وسيتم تفعيل اشتراكك فور موافقة الإدارة.",
    card: "bg-amber-50 dark:bg-amber-950/30 border-amber-400/40 text-amber-900 dark:text-amber-100", glow: "rgba(245,158,11,.35)" },
  approved: { icon: "✅", title: "تمت الموافقة وتفعيل الاشتراك", subtitle: "يمكنك الآن الوصول لكامل المنصة.",
    card: "bg-green-50 dark:bg-green-950/30 border-green-500/40 text-green-900 dark:text-green-100", glow: "rgba(34,197,94,.35)" },
  rejected: { icon: "❌", title: "تم رفض الطلب", subtitle: "راجع الملاحظات أدناه ثم أرسل وصلاً جديدًا.",
    card: "bg-red-50 dark:bg-red-950/30 border-red-500/40 text-red-900 dark:text-red-100", glow: "rgba(239,68,68,.35)" },
  expired: { icon: "⛔", title: "انتهى اشتراكك", subtitle: "لتجنب فقدان الوصول، جدّد اشتراكك الآن.",
    card: "bg-muted border-border", glow: "rgba(120,120,120,.25)" },
  none: { icon: "🪪", title: "لا يوجد طلب دفع بعد", subtitle: "ابدأ بإتمام أول اشتراك.",
    card: "bg-card border-border", glow: "rgba(212,175,55,.25)" },
};

function Timeline({ payment, status }: { payment: { created_at: string; approved_at?: string | null; rejected_at?: string | null } | undefined; status: StatusKey }) {
  const events = [
    { label: "إرسال الطلب", at: payment?.created_at, done: !!payment },
    { label: "مراجعة الإدارة", at: payment?.created_at, done: !!payment, active: status === "pending" },
    {
      label: status === "rejected" ? "تم الرفض" : "الموافقة وتفعيل الاشتراك",
      at: payment?.approved_at ?? payment?.rejected_at,
      done: status === "approved" || status === "rejected",
      danger: status === "rejected",
    },
  ];
  return (
    <ol className="relative border-s-2 border-border ms-3 ps-6 space-y-5">
      {events.map((e, i) => (
        <motion.li key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative">
          <span className={`absolute -start-[34px] top-1 w-5 h-5 rounded-full border-2 ${
            e.done && e.danger ? "bg-red-500 border-red-500" :
            e.done ? "bg-green-500 border-green-500" :
            e.active ? "bg-gold border-gold animate-pulse" :
            "bg-card border-border"
          }`} />
          <div className="text-sm font-semibold text-primary">{e.label}</div>
          {e.at && <div className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString("ar")}</div>}
        </motion.li>
      ))}
    </ol>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className={`text-sm font-semibold text-primary ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}