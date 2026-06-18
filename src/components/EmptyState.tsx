import type { ReactNode } from "react";

export type EmptyVariant =
  | "students"
  | "halaqas"
  | "events"
  | "evaluations"
  | "notifications"
  | "payments"
  | "homework"
  | "generic";

interface EmptyStateProps {
  variant?: EmptyVariant;
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/** Premium illustrated empty state — gold accents, glass card, Islamic motif. */
export function EmptyState({
  variant = "generic",
  icon,
  title,
  description,
  action,
  className = "",
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-card/80 via-card/60 to-primary/[0.04] backdrop-blur-xl shadow-soft ${
        compact ? "py-8 px-5" : "py-12 px-6"
      } text-center ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 islamic-pattern" aria-hidden />
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gold/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" aria-hidden />

      <div className="relative flex flex-col items-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl animate-glow" aria-hidden />
          {icon ? (
            <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-secondary text-3xl text-primary-foreground shadow-glow animate-float">
              {icon}
            </div>
          ) : (
            <Illustration variant={variant} />
          )}
        </div>
        <h3 className="text-lg md:text-xl font-bold text-primary mb-1.5">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mb-5 leading-relaxed">{description}</p>
        )}
        {action && <div className="flex flex-wrap items-center justify-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

function Illustration({ variant }: { variant: EmptyVariant }) {
  const common =
    "relative h-24 w-24 md:h-28 md:w-28 animate-float drop-shadow-[0_12px_24px_oklch(0.418_0.108_304/0.35)]";
  switch (variant) {
    case "halaqas":
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden>
          <defs>
            <linearGradient id="es-dome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="oklch(0.546 0.108 304)" />
              <stop offset="1" stopColor="oklch(0.418 0.108 304)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="oklch(0.945 0.012 305)" />
          <path d="M30 80 V55 Q60 18 90 55 V80 Z" fill="url(#es-dome)" />
          <circle cx="60" cy="48" r="5" fill="oklch(0.762 0.142 84)" />
          <rect x="34" y="80" width="52" height="14" rx="3" fill="oklch(0.418 0.108 304)" />
          <path d="M40 80 V70 M52 80 V66 M68 80 V66 M80 80 V70" stroke="oklch(0.762 0.142 84)" strokeWidth="2" />
        </svg>
      );
    case "students":
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden>
          <circle cx="60" cy="60" r="56" fill="oklch(0.945 0.012 305)" />
          <circle cx="60" cy="48" r="14" fill="oklch(0.418 0.108 304)" />
          <path d="M30 96 Q60 70 90 96 Z" fill="oklch(0.546 0.108 304)" />
          <path d="M40 42 L60 30 L80 42 L60 50 Z" fill="oklch(0.762 0.142 84)" />
          <line x1="80" y1="42" x2="80" y2="60" stroke="oklch(0.762 0.142 84)" strokeWidth="2.5" />
        </svg>
      );
    case "events":
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden>
          <circle cx="60" cy="60" r="56" fill="oklch(0.945 0.012 305)" />
          <rect x="28" y="34" width="64" height="58" rx="8" fill="oklch(0.995 0.004 305)" stroke="oklch(0.418 0.108 304)" strokeWidth="3" />
          <rect x="28" y="34" width="64" height="14" fill="oklch(0.418 0.108 304)" />
          <circle cx="42" cy="28" r="4" fill="oklch(0.762 0.142 84)" />
          <circle cx="78" cy="28" r="4" fill="oklch(0.762 0.142 84)" />
          <path d="M50 70 L57 78 L74 60" stroke="oklch(0.762 0.142 84)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "evaluations":
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden>
          <circle cx="60" cy="60" r="56" fill="oklch(0.945 0.012 305)" />
          <path d="M60 26 L70 50 L96 52 L76 70 L82 96 L60 82 L38 96 L44 70 L24 52 L50 50 Z" fill="oklch(0.762 0.142 84)" stroke="oklch(0.418 0.108 304)" strokeWidth="2.5" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden>
          <circle cx="60" cy="60" r="56" fill="oklch(0.945 0.012 305)" />
          <path d="M40 76 Q40 46 60 46 Q80 46 80 76 L86 84 H34 Z" fill="oklch(0.418 0.108 304)" />
          <circle cx="60" cy="40" r="5" fill="oklch(0.762 0.142 84)" />
          <path d="M53 88 Q60 96 67 88" stroke="oklch(0.418 0.108 304)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="84" cy="38" r="9" fill="oklch(0.762 0.142 84)" />
        </svg>
      );
    case "payments":
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden>
          <circle cx="60" cy="60" r="56" fill="oklch(0.945 0.012 305)" />
          <rect x="22" y="40" width="76" height="46" rx="8" fill="oklch(0.418 0.108 304)" />
          <rect x="22" y="50" width="76" height="8" fill="oklch(0.24 0.02 40)" />
          <rect x="32" y="68" width="22" height="6" rx="2" fill="oklch(0.762 0.142 84)" />
          <circle cx="84" cy="74" r="6" fill="oklch(0.762 0.142 84)" />
        </svg>
      );
    case "homework":
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden>
          <circle cx="60" cy="60" r="56" fill="oklch(0.945 0.012 305)" />
          <rect x="34" y="26" width="52" height="68" rx="6" fill="oklch(0.995 0.004 305)" stroke="oklch(0.418 0.108 304)" strokeWidth="3" />
          <line x1="42" y1="44" x2="78" y2="44" stroke="oklch(0.762 0.142 84)" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="56" x2="74" y2="56" stroke="oklch(0.418 0.108 304)" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="68" x2="68" y2="68" stroke="oklch(0.418 0.108 304)" strokeWidth="3" strokeLinecap="round" />
          <path d="M76 78 L82 84 L94 70" stroke="oklch(0.762 0.142 84)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden>
          <circle cx="60" cy="60" r="56" fill="oklch(0.945 0.012 305)" />
          <path d="M36 58 L60 38 L84 58 V86 H36 Z" fill="oklch(0.418 0.108 304)" />
          <rect x="52" y="68" width="16" height="18" fill="oklch(0.762 0.142 84)" />
        </svg>
      );
  }
}