import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import logoAsset from "@/assets/rawa-logo.png.asset.json";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LangSwitcher } from "@/lib/i18n";
import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { profile, primaryRole, signOut, can } = useAuth();
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const { location } = useRouterState();

  const nav = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: "🏠" },
    { to: "/halaqas", label: t("nav.halaqas"), icon: "🕌" },
    { to: "/events", label: t("nav.events"), icon: "🎤" },
    { to: "/chat", label: t("nav.chat"), icon: "💬" },
    { to: "/notifications", label: t("nav.notifications"), icon: "🔔" },
    { to: "/settings", label: t("nav.settings"), icon: "⚙️" },
  ];
  if (can("admin.access")) nav.push({ to: "/admin", label: t("nav.admin"), icon: "🛡️" });

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/" });
  };

  const roleLabel: Record<string, string> = {
    director: dir === "rtl" ? "مدير المنصة" : "Director",
    general_supervisor: dir === "rtl" ? "مشرف عام" : "General Supervisor",
    halaqa_supervisor: dir === "rtl" ? "مشرف حلقة" : "Halaqa Supervisor",
    teacher: dir === "rtl" ? "معلم" : "Teacher",
    student: dir === "rtl" ? "طالب" : "Student",
  };

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden lg:flex w-64 flex-col bg-card/60 backdrop-blur-xl border-l border-border shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <img src={logoAsset.url} alt="" className="w-10 h-10 rounded-full" />
          <div>
            <div className="font-bold text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>{t("app.name")}</div>
            <div className="text-[10px] text-muted-foreground">{t("app.tagline")}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const active = location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active ? "bg-gradient-royal text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="text-lg">{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="px-3 py-2 rounded-xl bg-muted/50">
            <div className="text-sm font-semibold text-primary truncate">{profile?.full_name || profile?.email}</div>
            <div className="text-[11px] text-gold">{primaryRole ? roleLabel[primaryRole] : ""}</div>
          </div>
          <button onClick={handleSignOut} className="w-full px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition text-start">
            ⎋ {t("nav.logout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 lg:hidden">
            <img src={logoAsset.url} alt="" className="w-9 h-9 rounded-full" />
            <div className="font-bold text-primary">{t("app.name")}</div>
          </div>
          <div className="hidden lg:block text-sm text-muted-foreground">
            {t("dash.welcome")}، <span className="text-primary font-semibold">{profile?.full_name || profile?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <button onClick={handleSignOut} className="lg:hidden px-3 py-1.5 rounded-full text-xs text-destructive border border-destructive/30">
              {t("nav.logout")}
            </button>
          </div>
        </header>

        <nav className="lg:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-border bg-card/40">
          {nav.map((n) => {
            const active = location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${active ? "bg-gradient-royal text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {n.icon} {n.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}