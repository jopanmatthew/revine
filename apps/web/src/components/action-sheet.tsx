"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const DESKTOP_QUERY = "(min-width: 640px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True from 640px up. Server render and hydration assume a phone (mobile-first). */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

/**
 * The one sheet every flow uses: a bottom sheet on phones and a
 * side panel on desktop. The footer holds the primary action and stays pinned while the body scrolls.
 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dismissible = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean; // false while a transaction runs
}) {
  const desktop = useIsDesktop();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Sheet open={open} onOpenChange={(next) => (next || dismissible) && onOpenChange(next)}>
      <SheetContent
        ref={contentRef}
        tabIndex={-1}
        side={desktop ? "right" : "bottom"}
        showCloseButton={dismissible}
        // Focus the sheet itself, not its first button (often a tiny copy icon): screen readers
        // still land inside the dialog, and nothing looks pre-selected.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus();
        }}
        className={cn(
          "gap-0 bg-card outline-none",
          desktop
            ? "data-[side=right]:inset-y-3 data-[side=right]:right-3 data-[side=right]:h-auto data-[side=right]:w-[calc(100%-1.5rem)] data-[side=right]:rounded-3xl data-[side=right]:border-0 data-[side=right]:shadow-[0_40px_80px_-30px_rgb(11_31_26/0.5)] data-[side=right]:sm:max-w-md"
            : "max-h-[92dvh] rounded-t-3xl border-0",
        )}
      >
        {!desktop && <div aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground/15" />}
        <SheetHeader className="shrink-0 gap-1 px-6 pt-6 pr-14 pb-4">
          <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div data-slot="sheet-body" className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain px-6 pb-6 [&>*]:shrink-0">{children}</div>
        {footer && (
          <SheetFooter className="mt-0 shrink-0 border-t bg-card px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
