"use client";

import { LockIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react";

import { RupiahAmount } from "@/components/rupiah-amount";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceDetailsResult } from "@/lib/hooks";
import { formatNumber, formatRupiah } from "@/lib/format";
import { isNeutralError, MESSAGES } from "@/lib/messages";
import { cn } from "@/lib/utils";

/**
 * The private half of an invoice: line items, description and the fingerprint check (PRD §9.8,
 * §9.10, §14.2). Rendered from useInvoiceDetails() so the review sheet and invoice page match.
 */
export function PrivateDetails({ result }: { result: InvoiceDetailsResult }) {
  const { details, matches, isLoading, error, load } = result;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <p className="text-sm text-ink-muted">Verifying your wallet and loading the private details…</p>
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    const neutral = isNeutralError(error.message);
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col gap-3 rounded-lg px-3.5 py-3 text-sm",
          neutral ? "bg-muted text-ink" : "bg-danger/10 text-danger",
        )}
      >
        <p>{error.message}</p>
        <Button variant="outline" className="h-10 w-fit bg-card text-ink" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!details) return null;

  const total = details.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-foreground/[0.07] overflow-hidden rounded-lg ring-1 ring-foreground/10">
        {details.items.map((item, i) => (
          <li key={i} className="flex items-start justify-between gap-4 px-3.5 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium [overflow-wrap:anywhere] text-ink">{item.name}</span>
              <span className="text-xs text-ink-muted tabular-nums">
                {formatNumber(item.qty)} × {formatRupiah(item.unitPrice)}
              </span>
            </div>
            <RupiahAmount value={item.qty * item.unitPrice} className="font-medium" />
          </li>
        ))}
        <li className="flex items-center justify-between gap-4 bg-muted/60 px-3.5 py-3">
          <span className="font-medium">Total</span>
          <RupiahAmount value={total} className="font-bold" />
        </li>
      </ul>

      {details.description && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Description</span>
          <p className="text-sm [overflow-wrap:anywhere] text-ink">{details.description}</p>
        </div>
      )}

      {matches ? (
        <p className="flex items-center gap-2 rounded-lg bg-brand-700/[0.07] px-3.5 py-3 text-sm font-medium text-brand-700">
          <ShieldCheckIcon className="size-4 shrink-0" aria-hidden />
          Details match the on-chain fingerprint
        </p>
      ) : (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3.5 py-3 text-sm font-medium text-danger">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {/* §11 text verbatim; its leading ⚠ is drawn as the icon. */}
          {MESSAGES.fingerprintMismatch.replace(/^⚠\s*/, "")}
        </p>
      )}
    </div>
  );
}

/** What everyone except the seller and buyer sees (§9.10). */
export function PrivateDetailsLocked() {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-muted px-3.5 py-3 text-sm text-ink-muted">
      <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      Line items and description are private. Only the seller and buyer can see them.
    </p>
  );
}
