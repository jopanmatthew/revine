import Link from "next/link";
import type { ReactNode } from "react";

import { panelClass } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** "Beras Bu Sari" → "B"; an unnamed "0x12…ab" → "0x". The landing's marketplace avatar. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = name.startsWith("0x") ? "0x" : name.trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-900 font-bold text-white",
        initial.length > 1 ? "text-[0.6875rem]" : "text-sm",
        className,
      )}
    >
      {initial}
    </span>
  );
}

/**
 * The ledger: one white sheet (the landing's panel) ruled in hairlines, one line per invoice. An
 * optional header row carries the list's controls. No card inside a card; a line opens its invoice.
 */
export function LedgerSheet({ children, header, className }: { children: ReactNode; header?: ReactNode; className?: string }) {
  return (
    <div className={cn(panelClass, className)}>
      {header && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/[0.07] px-3 py-2.5 sm:px-5">
          {header}
        </div>
      )}
      <ul>{children}</ul>
    </div>
  );
}

/**
 * One line: who (with an avatar) and what, status (said once), amount with its date, and at most
 * one action. The whole line links to the invoice; the action sits above that link.
 */
export function LedgerLine({
  href,
  label,
  avatar,
  date,
  title,
  meta,
  status,
  amount,
  sub,
  action,
  fresh,
}: {
  href: string;
  label: string; // accessible name for the line's link, e.g. "Open invoice #12"
  avatar: string; // the counterparty's name, for the initial
  date?: string;
  title: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  amount: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  fresh?: boolean;
}) {
  return (
    <li
      data-fresh={fresh || undefined}
      className="relative grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-3 border-b border-foreground/[0.07] px-4 py-4 transition-colors duration-150 last:border-b-0 hover:bg-muted/40 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(8rem,auto)_8.5rem] sm:gap-x-5 sm:px-6"
    >
      <Avatar name={avatar} />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-bold text-ink">{title}</span>
        {(meta || status) && (
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
            {status && <span className="sm:hidden">{status}</span>}
            {meta}
          </span>
        )}
      </div>
      <span className="max-sm:hidden">{status}</span>
      <div className="flex flex-col items-end gap-0.5 text-right">
        <span data-print className="text-base font-bold text-ink tabular-nums sm:text-lg">
          {amount}
        </span>
        {date && <span className="text-xs text-ink-muted tabular-nums">{date}</span>}
        {sub}
      </div>
      <div
        className={cn(
          "relative z-10 flex justify-end",
          action ? "col-span-2 col-start-2 sm:col-span-1 sm:col-start-auto" : "max-sm:hidden",
        )}
      >
        {action}
      </div>
      <Link
        href={href}
        aria-label={label}
        className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      />
    </li>
  );
}

export function LedgerSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={panelClass} aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3.5 border-b border-foreground/[0.07] px-4 py-4 last:border-b-0 sm:px-6">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-28" />
        </div>
      ))}
    </div>
  );
}

/** A quiet sheet for an empty tab: what's missing, and the way forward. */
export function LedgerEmpty({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className={cn(panelClass, "flex flex-col items-center gap-3 px-6 py-14 text-center sm:py-20")}>
      <p className="text-lg font-bold tracking-tight text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-pretty text-ink-muted">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
