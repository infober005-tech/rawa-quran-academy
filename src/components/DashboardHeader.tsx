import { LogoPremium3D } from "@/components/LogoPremium3D";
import type { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
}

/** Shared premium dashboard header — glass + gold halo + Rawa 3D logo. */
export function DashboardHeader({ title, subtitle, badge, actions }: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-primary/10 via-card to-gold/10 px-5 py-4 md:px-7 md:py-5 shadow-soft">
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gold/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <LogoPremium3D size="sm" halo />
        <div className="min-w-0">
          {badge && (
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-gold mb-1">
              {badge}
            </div>
          )}
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-primary truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
