import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PaymentPage } from "@/features/subscription/PaymentPage";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

function SubscribeGuarded() {
  const { primaryRole, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return null;
  if (primaryRole !== "student") return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6">
      <DashboardHeader title={t("s.subscribe_title")} subtitle={t("s.subscribe_subtitle")} badge={t("s.subscribe_badge")} />
      <PaymentPage />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/subscribe")({
  component: () => (
    <DashboardShell>
      <SubscribeGuarded />
    </DashboardShell>
  ),
});
