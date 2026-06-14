import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PaymentPage } from "@/features/subscription/PaymentPage";

export const Route = createFileRoute("/_authenticated/subscribe")({
  component: () => <DashboardShell><PaymentPage /></DashboardShell>,
});