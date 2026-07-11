import { useNavigate } from "@tanstack/react-router";
import logoAsset from "@/assets/rawa-logo.png.asset.json";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LangSwitcher } from "@/lib/i18n";
import { useNotificationToasts } from "@/hooks/useNotificationToasts";
import { PremiumSidebar, MobileSidebar } from "@/components/PremiumSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  useNotificationToasts();

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/" });
  };

  return (
    <div dir={dir} className="min-h-dvh bg-hero text-foreground flex">
      <PremiumSidebar onSignOut={handleSignOut} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 glass-panel border-b border-border/60 px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <MobileSidebar onSignOut={handleSignOut} />
            <div className="flex items-center gap-3 lg:hidden min-w-0">
              <img src={logoAsset.url} alt="" className="w-9 h-9 rounded-full ring-2 ring-gold/40 shrink-0" />
              <div className="font-bold text-primary truncate">{t("app.name")}</div>
            </div>
            <div className="hidden lg:block text-sm text-muted-foreground truncate">
              {t("dash.welcome")}, <span className="text-primary font-semibold">{profile?.full_name || profile?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LangSwitcher />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">{children}</main>
      </div>

      <MobileBottomNav onSignOut={handleSignOut} />
    </div>
  );
}