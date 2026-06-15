import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { UsersPanel } from "@/features/admin/UsersPanel";
import { HalaqasPanel } from "@/features/admin/HalaqasPanel";
import { EventsPanel } from "@/features/admin/EventsPanel";
import { CalendarPanel } from "@/features/admin/CalendarPanel";
import { ParentLinksPanel } from "@/features/admin/ParentLinksPanel";
import { PaymentsPanel } from "@/features/admin/PaymentsPanel";
import { PaymentSettingsPanel } from "@/features/admin/PaymentSettingsPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    const allowed = (roles ?? []).some((r) =>
      ["director", "general_supervisor"].includes(r.role as string),
    );
    if (!allowed) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

type Tab = "users" | "halaqas" | "events" | "calendar" | "parents" | "payments" | "payment_settings";

function AdminPage() {
  const { can, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    if (!loading && !can("admin.access")) void navigate({ to: "/dashboard" });
  }, [loading, can, navigate]);

  if (!can("admin.access")) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "users", label: t("dir.users") },
    { id: "halaqas", label: t("dir.halaqas") },
    { id: "events", label: t("dir.events") },
    { id: "calendar", label: t("dir.calendar") },
    { id: "parents", label: "Parent Links" },
    { id: "payments", label: "💳 المدفوعات" },
    { id: "payment_settings", label: "⚙️ إعدادات الدفع" },
  ];

  return (
    <DashboardShell>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-3xl font-bold text-primary">{t("nav.admin")}</h1>
        <div className="flex gap-1 p-1 bg-muted rounded-full text-sm overflow-x-auto">
          {tabs.map((x) => (
            <button key={x.id} onClick={() => setTab(x.id)}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap ${tab === x.id ? "bg-gradient-royal text-primary-foreground" : "text-muted-foreground"}`}>
              {x.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "users" && <UsersPanel />}
      {tab === "halaqas" && <HalaqasPanel />}
      {tab === "events" && <EventsPanel />}
      {tab === "calendar" && <CalendarPanel />}
      {tab === "parents" && <ParentLinksPanel />}
      {tab === "payments" && <PaymentsPanel />}
      {tab === "payment_settings" && <PaymentSettingsPanel />}
    </DashboardShell>
  );
}