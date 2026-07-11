import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, BookOpen, Bell, User, Menu } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "@/components/PremiumSidebar";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function MobileBottomNav({ onSignOut }: { onSignOut: () => void }) {
  const { t, dir } = useI18n();
  const { location } = useRouterState();
  const [moreOpen, setMoreOpen] = useState(false);

  const items: Item[] = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: Home },
    { to: "/halaqas", label: t("nav.halaqas"), icon: BookOpen },
    { to: "/notifications", label: t("nav.notifications"), icon: Bell },
    { to: "/settings", label: t("nav.profile"), icon: User },
  ];

  return (
    <>
      <nav
        dir={dir}
        aria-label="bottom navigation"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 glass-panel border-t border-border/60 safe-pb"
      >
        <ul className="grid grid-cols-5 gap-1 px-2 pt-1.5 pb-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = location.pathname.startsWith(it.to);
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 min-h-11 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-gradient-gold"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-5 w-5" />
                  <span className="truncate max-w-full">{it.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex w-full flex-col items-center justify-center gap-0.5 min-h-11 rounded-xl px-1 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
              aria-label={t("nav.more")}
            >
              <Menu className="h-5 w-5" />
              <span>{t("nav.more")}</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* The "More" button reuses the existing mobile drawer */}
      {moreOpen && (
        <div className="lg:hidden fixed bottom-20 inset-x-4 z-50 glass-card rounded-2xl p-3 shadow-premium animate-pop">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">{t("nav.full_menu")}</span>
            <MobileSidebar onSignOut={onSignOut} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("nav.menu_hint")}
          </p>
        </div>
      )}
    </>
  );
}