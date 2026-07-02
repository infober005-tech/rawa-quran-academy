import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * PageShell — consistent max-width, horizontal padding, and safe-area
 * bottom on every authenticated page. Use as the outermost wrapper
 * inside a route component.
 */
export function PageShell({
  className,
  children,
  as: Tag = "div",
  wide,
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "main" | "article";
  /** Wider container (dashboards / analytics). Default is content-friendly. */
  wide?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        "pb-[max(env(safe-area-inset-bottom),1.5rem)]",
        wide ? "max-w-7xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * StatGrid — auto-fit responsive KPI grid. 1 col mobile, 2 col sm,
 * fills to 4 on desktop. Use for dashboard headline metrics.
 */
export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}