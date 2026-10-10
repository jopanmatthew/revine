import type { ReactNode } from "react";
import { CircleAlertIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

/**
 * The app screens' frame: one column, phone-first, generous bottom room for sticky actions. With
 * `overlap`, its first sheet rises over the cover band's bottom edge, like the landing's product stage.
 */
export function PageContainer({
  children,
  className,
  overlap = false,
}: {
  children: ReactNode;
  className?: string;
  overlap?: boolean;
}) {
  return (
    <div
      data-motion="page"
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-24 sm:gap-8 sm:pb-20",
        overlap ? "relative z-10 -mt-12 sm:-mt-14" : "pt-6 sm:pt-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The landing's white sheet: large radius, hairline ring, a long soft shadow under it. */
export const panelClass =
  "overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/[0.06] shadow-[0_24px_48px_-36px_rgb(11_31_26/0.26)]";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn(panelClass, className)}>{children}</section>;
}

/** A panel's heading row: bold title, optional quiet hint, optional controls on the right. */
export function PanelHeader({ title, hint, children }: { title: ReactNode; hint?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-foreground/[0.07] px-5 py-4 sm:px-6">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function ErrorNote({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-danger/10 px-4 py-3.5 text-sm text-danger">
      <CircleAlertIcon className="size-5 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">{children}</p>
      {onRetry && <Button variant="outline" className="h-10 gap-2 bg-card px-4 text-ink" onClick={onRetry}><RefreshCwIcon className="size-4" aria-hidden />Try again</Button>}
    </div>
  );
}
