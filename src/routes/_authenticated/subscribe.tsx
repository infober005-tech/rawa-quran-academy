import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PaymentPage } from "@/features/subscription/PaymentPage";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

function SubscribeGuarded() {
  const { primaryRole, loading } = useAuth();
  if (loading) return null;
  if (primaryRole !== "student") return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6">
      <DashboardHeader title="الاشتراك" subtitle="Subscription & Payments" badge="Billing" />
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