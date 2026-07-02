import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * ResponsiveDialog — full-screen bottom drawer on mobile (<768px),
 * centered dialog on tablet+. Drop-in replacement for shadcn Dialog
 * across the platform. Props stay compatible: children, open,
 * onOpenChange, plus optional className for the content container.
 *
 * Usage:
 *   <ResponsiveDialog open={open} onOpenChange={setOpen}>
 *     <ResponsiveDialogHeader>
 *       <ResponsiveDialogTitle>Title</ResponsiveDialogTitle>
 *       <ResponsiveDialogDescription>...</ResponsiveDialogDescription>
 *     </ResponsiveDialogHeader>
 *     <div className="rd-body">...</div>
 *     <ResponsiveDialogFooter>...</ResponsiveDialogFooter>
 *   </ResponsiveDialog>
 */

type Ctx = { isMobile: boolean };
const ResponsiveDialogCtx = React.createContext<Ctx>({ isMobile: false });

export interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** Force render as dialog even on mobile (rare — e.g. confirmation modal). */
  forceDialog?: boolean;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  className,
  forceDialog,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile() && !forceDialog;

  if (isMobile) {
    return (
      <ResponsiveDialogCtx.Provider value={{ isMobile: true }}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent
            className={cn(
              "max-h-[92vh] px-4 pb-[max(env(safe-area-inset-bottom),1rem)]",
              className,
            )}
          >
            <div className="overflow-y-auto -mx-4 px-4">{children}</div>
          </DrawerContent>
        </Drawer>
      </ResponsiveDialogCtx.Provider>
    );
  }

  return (
    <ResponsiveDialogCtx.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("sm:max-w-lg", className)}>{children}</DialogContent>
      </Dialog>
    </ResponsiveDialogCtx.Provider>
  );
}

export function ResponsiveDialogHeader(
  props: React.HTMLAttributes<HTMLDivElement>,
) {
  const { isMobile } = React.useContext(ResponsiveDialogCtx);
  return isMobile ? <DrawerHeader {...props} /> : <DialogHeader {...props} />;
}

export function ResponsiveDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = React.useContext(ResponsiveDialogCtx);
  return isMobile ? (
    <DrawerFooter className={cn("stack-actions", className)} {...props} />
  ) : (
    <DialogFooter className={className} {...props} />
  );
}

export function ResponsiveDialogTitle(
  props: React.ComponentProps<typeof DialogTitle>,
) {
  const { isMobile } = React.useContext(ResponsiveDialogCtx);
  return isMobile ? <DrawerTitle {...props} /> : <DialogTitle {...props} />;
}

export function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>,
) {
  const { isMobile } = React.useContext(ResponsiveDialogCtx);
  return isMobile ? (
    <DrawerDescription {...props} />
  ) : (
    <DialogDescription {...props} />
  );
}