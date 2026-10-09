"use client";

import { CircleAlertIcon, CircleCheckIcon, CircleDotIcon, SparklesIcon } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buyerRecord, pairHistory, recordSummary, TIER_LABELS, type BuyerTier } from "@/lib/buyer-record";
import { formatPercent, nowSeconds } from "@/lib/format";
import { useInvoices } from "@/lib/hooks";
import { useDisplayNameLookup } from "@/lib/profile-names";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIER_STYLE: Record<BuyerTier, { light: string; dark: string; icon: typeof CircleCheckIcon }> = {
  reliable: { light: "border-brand-700/20 bg-brand-700/10 text-brand-700", dark: "border-mint/30 bg-mint/15 text-mint", icon: CircleCheckIcon },
  mixed: { light: "bg-warning text-warning-foreground", dark: "bg-amber-300/15 text-amber-200", icon: CircleDotIcon },
  risky: { light: "bg-danger/10 text-danger", dark: "bg-red-400/15 text-red-200", icon: CircleAlertIcon },
  new: { light: "border-foreground/15 text-ink-muted", dark: "border-white/20 text-white/75", icon: SparklesIcon },
};

/** The buyer's payment record (PRD §7), from the invoices the hooks already load. */
export function useBuyerRecord(buyer: Address) {
  const { invoices, isLoading } = useInvoices();
  const record = useMemo(() => buyerRecord(invoices, buyer, nowSeconds()), [invoices, buyer]);
  return { record, invoices, isLoading };
}

/** "Reliable payer" chip with the record in its tooltip. */
export function BuyerRecordChip({
  buyer,
  tone = "light",
  className,
}: {
  buyer: Address;
  tone?: "light" | "dark";
  className?: string;
}) {
  const { record, isLoading } = useBuyerRecord(buyer);
  if (isLoading) return null;
  const style = TIER_STYLE[record.tier];
  const Icon = style.icon;
  const label = record.tier === "new" ? TIER_LABELS.new : `${TIER_LABELS[record.tier]} payer`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" tabIndex={0} className={cn(tone === "dark" ? style.dark : style.light, className)}>
          <Icon data-icon="inline-start" />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {record.tier === "new"
          ? "No financed invoice repaid on revine. yet"
          : `${recordSummary(record)} · from ${record.sellers} ${record.sellers === 1 ? "seller" : "sellers"}`}
      </TooltipContent>
    </Tooltip>
  );
}

/** The full record for the Buy sheet: what the chain shows, plus the cold-start guidance (§9.9). */
export function BuyerRecordPanel({ buyer, seller }: { buyer: Address; seller: Address }) {
  const { record, invoices, isLoading } = useBuyerRecord(buyer);
  const displayName = useDisplayNameLookup();
  if (isLoading) return null;
  const pair = pairHistory(invoices, seller, buyer);
  const name = displayName(buyer);

  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-muted/50 px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{name}&apos;s payment record</span>
        <BuyerRecordChip buyer={buyer} />
      </div>
      {record.tier === "new" ? (
        <p className="text-sm text-pretty text-ink-muted">
          New buyer · no payment record yet. Price the risk: this would be their first financed invoice on revine.
        </p>
      ) : (
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs text-ink-muted">Paid on time</dt>
            <dd className="font-bold text-ink tabular-nums">{record.onTime}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Late</dt>
            <dd className="font-bold text-ink tabular-nums">
              {record.late}
              {record.late > 0 && (
                <span className="font-normal text-ink-muted"> (up to {record.maxDaysLate}d)</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Overdue now</dt>
            <dd className={cn("font-bold tabular-nums", record.overdue > 0 ? "text-danger" : "text-ink")}>
              {record.overdue}
            </dd>
          </div>
        </dl>
      )}
      <p className="text-xs text-ink-muted">
        {record.tier !== "new" &&
          `${formatPercent(record.onTimeRate * 100, 0)} of financed Rupiah repaid on time, across ${record.sellers} ${record.sellers === 1 ? "seller" : "sellers"}. `}
        {pair.paid > 0
          ? `${displayName(seller)} has been paid by this buyer ${pair.paid} ${pair.paid === 1 ? "time" : "times"} (${pair.onTime} on time).`
          : `First invoice between ${displayName(seller)} and this buyer.`}{" "}
        From on-chain repayment dates.
      </p>
    </div>
  );
}
