import type { ReactNode } from "react";

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

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3.5 text-sm text-danger">
      {children}
    </p>
  );
}

/** The screen's primary action: a sticky bottom bar on phones (PRD §9.1), inline from 640px. */
export function StickyAction({ children }: { children: ReactNode }) {
  return (
    <div className="max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-30 max-sm:flex max-sm:gap-2 max-sm:border-t max-sm:border-foreground/10 max-sm:bg-background/90 max-sm:px-4 max-sm:pt-3 max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] max-sm:backdrop-blur-md max-sm:[&>*]:flex-1">
      {children}
    </div>
  );
}
