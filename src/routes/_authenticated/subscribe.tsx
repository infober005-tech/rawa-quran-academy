import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PaymentPage } from "@/features/subscription/PaymentPage";
import { DashboardHeader } from "@/components/DashboardHeader";

export const Route = createFileRoute("/_authenticated/subscribe")({
  component: () => (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader title="الاشتراك" subtitle="Subscription & Payments" badge="Billing" />
        <PaymentPage />
      </div>
    </DashboardShell>
  ),
});