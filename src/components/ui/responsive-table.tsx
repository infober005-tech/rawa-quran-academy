import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * ResponsiveTable — desktop table + mobile card list from a single
 * column definition. Renders a real <table> at md+ and a stacked
 * glass-card list below md so admin lists stop overflowing on phones.
 *
 * Columns define both the header label and a per-row cell renderer.
 * The mobile card uses the same renderer with the label as a caption.
 * Set `hideOnMobile` on secondary columns to keep the mobile card
 * uncluttered; set `primary` on the column that should be the card
 * title (rendered large at the top).
 */

export type ResponsiveColumn<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  headClassName?: string;
  hideOnMobile?: boolean;
  /** Row's primary title on mobile card. Only one column should be primary. */
  primary?: boolean;
};

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveColumn<T>[];
  rowKey: (row: T, index: number) => string;
  empty?: React.ReactNode;
  /** Optional trailing action zone rendered on mobile card footer. */
  mobileActions?: (row: T, index: number) => React.ReactNode;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
}

export function ResponsiveTable<T>({
  data,
  columns,
  rowKey,
  empty,
  mobileActions,
  className,
  onRowClick,
}: ResponsiveTableProps<T>) {
  if (!data.length && empty) return <>{empty}</>;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop / tablet ≥ md */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border/60 bg-card/40">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={cn("px-4 py-3", c.headClassName)}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                    {c.cell(row, i)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile < md */}
      <ul className="md:hidden space-y-3">
        {data.map((row, i) => {
          const primary = columns.find((c) => c.primary);
          const rest = columns.filter((c) => !c.primary && !c.hideOnMobile);
          return (
            <li
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row, i) : undefined}
              className={cn(
                "glass-card rounded-2xl p-4 space-y-3",
                onRowClick && "cursor-pointer active:scale-[0.99] transition-transform",
              )}
            >
              {primary && (
                <div className="text-base font-semibold text-foreground">
                  {primary.cell(row, i)}
                </div>
              )}
              {rest.length > 0 && (
                <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1.5 text-sm">
                  {rest.map((c) => (
                    <React.Fragment key={c.key}>
                      <dt className="text-muted-foreground text-xs pt-0.5">{c.header}</dt>
                      <dd className="min-w-0 text-foreground text-start">{c.cell(row, i)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              )}
              {mobileActions && (
                <div className="pt-2 border-t border-border/50 flex flex-wrap gap-2 stack-actions">
                  {mobileActions(row, i)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}