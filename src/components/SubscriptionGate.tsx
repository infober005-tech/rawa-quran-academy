import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useI18n } from "@/lib/i18n";

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const { primaryRole, loading } = useAuth();
  // Only students are gated. Staff, parents, and directors always have full access.
  if (loading) return <div className="py-20 text-center text-muted-foreground">…</div>;
  if (primaryRole !== "student") return <>{children}</>;
  return <StudentGate>{children}</StudentGate>;
}

function StudentGate({ children }: { children: ReactNode }) {
  const { isActive, subscription, loading: subLoading } = useSubscription();
  const { t } = useI18n();
  if (subLoading) return <div className="py-20 text-center text-muted-foreground">…</div>;
  if (isActive) return <>{children}</>;

  const statusLabel =
    subscription?.status === "pending" ? t("sub.status.pending") :
    subscription?.status === "rejected" ? t("sub.status.rejected") :
    subscription?.status === "expired" ? t("sub.status.expired") : t("sub.status.inactive");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-10">
      <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-primary/95 via-primary to-primary/90 text-primary-foreground p-10 shadow-glow">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gold/30 blur-3xl rounded-full" />
        <div className="relative">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold mb-3">{t("sub.gate.title")}</h2>
          <p className="opacity-90 mb-6">{t("sub.gate.desc")}</p>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs uppercase tracking-wide opacity-70">{t("sub.gate.status")}</span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-semibold">{statusLabel}</span>
          </div>
          <Link to="/subscribe" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-primary font-bold shadow-lg hover:scale-[1.02] transition">
            {t("sub.gate.cta")} ←
          </Link>
        </div>
      </div>
    </motion.div>
  );
}