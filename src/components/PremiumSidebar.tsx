import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Home, BookOpen, Calendar, Bell, Settings, ShieldCheck,
  ChevronLeft, ChevronRight, LogOut, Menu, X, CreditCard,
} from "lucide-react";
import logoAsset from "@/assets/rawa-logo.png.asset.json";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function usePremiumNav(): NavItem[] {
  const { t, dir } = useI18n();
  const { can, primaryRole } = useAuth();
  return useMemo(() => {
    const items: NavItem[] = [
      { to: "/dashboard", label: t("nav.dashboard"), icon: Home },
      { to: "/halaqas", label: t("nav.halaqas"), icon: BookOpen },
      { to: "/events", label: t("nav.events"), icon: Calendar },
    ];
    if (primaryRole === "student") {
      items.push({ to: "/subscribe", label: dir === "rtl" ? "الاشتراك" : "Subscription", icon: CreditCard });
    }
    items.push(
      { to: "/notifications", label: t("nav.notifications"), icon: Bell },
      { to: "/settings", label: t("nav.settings"), icon: Settings },
    );
    if (can("admin.access")) items.push({ to: "/admin", label: t("nav.admin"), icon: ShieldCheck });
    return items;
  }, [t, dir, can, primaryRole]);
}

function NavList({
  items, activePath, collapsed, onNavigate,
}: { items: NavItem[]; activePath: string; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1.5" aria-label="primary">
      {items.map((n) => {
        const active = activePath.startsWith(n.to);
        const Icon = n.icon;
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "hover:bg-gold/10 hover:text-gold",
              active ? "text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-royal shadow-glow"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <motion.span
              whileHover={{ scale: 1.15, rotate: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                active ? "bg-white/15 text-primary-foreground" : "bg-muted/60 text-foreground/70 group-hover:bg-gold/20 group-hover:text-gold",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </motion.span>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="truncate"
                >
                  {n.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-5">
      <div className="relative shrink-0">
        <div className="absolute inset-0 -m-1 rounded-full bg-gradient-gold opacity-50 blur-md" />
        <img src={logoAsset.url} alt="" className="relative h-11 w-11 rounded-full ring-2 ring-gold/40" />
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="min-w-0"
          >
            <div className="truncate font-bold text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>
              {t("app.name")}
            </div>
            <div className="truncate text-[10px] uppercase tracking-wider text-gold">{t("app.tagline")}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarFooter({
  collapsed, onSignOut,
}: { collapsed: boolean; onSignOut: () => void }) {
  const { profile, primaryRole } = useAuth();
  const { t, dir } = useI18n();
  const roleLabel: Record<string, string> = {
    director: dir === "rtl" ? "مدير المنصة" : "Director",
    general_supervisor: dir === "rtl" ? "مشرف عام" : "General Supervisor",
    halaqa_supervisor: dir === "rtl" ? "مشرف حلقة" : "Halaqa Supervisor",
    teacher: dir === "rtl" ? "معلم" : "Teacher",
    student: dir === "rtl" ? "طالب" : "Student",
    parent: dir === "rtl" ? "ولي أمر" : "Parent",
  };
  return (
    <div className="border-t border-border/60 p-3 space-y-2">
      {!collapsed && (
        <div className="rounded-xl bg-muted/50 px-3 py-2.5">
          <div className="truncate text-sm font-semibold text-primary">{profile?.full_name || profile?.email}</div>
          <div className="truncate text-[11px] font-medium text-gold">{primaryRole ? roleLabel[primaryRole] : ""}</div>
        </div>
      )}
      <button
        onClick={onSignOut}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10",
          collapsed && "justify-center",
        )}
        aria-label={t("nav.logout")}
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && <span>{t("nav.logout")}</span>}
      </button>
    </div>
  );
}

export function PremiumSidebar({ onSignOut }: { onSignOut: () => void }) {
  const items = usePremiumNav();
  const { location } = useRouterState();
  const [collapsed, setCollapsed] = useState(false);
  const { dir } = useI18n();

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 272 }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className={cn(
        "relative hidden lg:flex flex-col shrink-0",
        "glass-panel",
        dir === "rtl" ? "border-l" : "border-r",
      )}
    >
      <SidebarHeader collapsed={collapsed} />
      <NavList items={items} activePath={location.pathname} collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} onSignOut={onSignOut} />

      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          "absolute top-8 z-10 grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-colors hover:bg-gold/15 hover:text-gold",
          dir === "rtl" ? "-left-3" : "-right-3",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {(dir === "rtl" ? !collapsed : collapsed) ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}

export function MobileSidebar({ onSignOut }: { onSignOut: () => void }) {
  const items = usePremiumNav();
  const { location } = useRouterState();
  const { dir } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-primary shadow-soft"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side={dir === "rtl" ? "right" : "left"}
        className="w-[280px] p-0 flex flex-col glass-panel"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <span className="text-sm font-semibold text-primary">القائمة</span>
          <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarHeader collapsed={false} />
        <div className="flex-1 overflow-y-auto">
          <NavList items={items} activePath={location.pathname} collapsed={false} onNavigate={() => setOpen(false)} />
        </div>
        <SidebarFooter collapsed={false} onSignOut={onSignOut} />
      </SheetContent>
    </Sheet>
  );
}