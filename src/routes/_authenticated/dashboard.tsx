import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { DashboardShell } from "@/components/DashboardShell";
import {
  StudentDashboard,
  TeacherDashboard,
  SupervisorDashboard,
  GeneralSupervisorDashboard,
  DirectorDashboard,
  ParentDashboard,
  LazyDashboard,
} from "@/components/RoleDashboards";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const { profile, primaryRole, loading } = useAuth();
  const { t } = useI18n();

  if (loading || !profile) {
    return <DashboardShell><div className="text-center text-muted-foreground py-20">{t("common.loading")}</div></DashboardShell>;
  }

  if (primaryRole === "student" && profile.status !== "approved") {
    const msg = profile.status === "pending_review" ? t("status.pending") : profile.status === "rejected" ? t("status.rejected") : t("status.suspended");
    return (
      <DashboardShell>
        <div className="max-w-2xl mx-auto mt-12 p-10 rounded-3xl bg-card border border-gold/30 text-center shadow-soft">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-primary mb-3">{t("dash.welcome")}، {profile.full_name}</h1>
          <p className="text-muted-foreground">{msg}</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <LazyDashboard>
        {primaryRole === "director" && <DirectorDashboard />}
        {primaryRole === "general_supervisor" && <GeneralSupervisorDashboard />}
        {primaryRole === "halaqa_supervisor" && <SupervisorDashboard />}
        {primaryRole === "teacher" && <TeacherDashboard />}
        {primaryRole === "student" && <StudentDashboard />}
        {primaryRole === "parent" && <ParentDashboard />}
      </LazyDashboard>
    </DashboardShell>
  );
}