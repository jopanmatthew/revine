"use client";

import { ShieldAlertIcon } from "lucide-react";

import { ActionSheet } from "@/components/action-sheet";
import { AddressName } from "@/components/address-name";
import { BalanceShortfall, useCanAfford } from "@/components/balance-check";
import { BuyerRecordPanel } from "@/components/buyer-record";
import { CreditBadgeChip } from "@/components/credit-badge-chip";
import { MoneyBridge } from "@/components/money-bridge";
import { ReturnLine } from "@/components/return-line";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatRupiah } from "@/lib/format";
import { useDisplayNameLookup } from "@/lib/profile-names";
import type { Invoice } from "@/lib/types";

/** Buy sheet (§9.9): what you pay, what you get and when, who stands behind it, and the risk. */
export function BuySheet({
  invoice,
  open,
  onOpenChange,
  onBuy,
  disabled,
}: {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy: () => void;
  disabled: boolean; // wrong network
}) {
  const { midr, isLoading, enough } = useCanAfford(invoice.askPrice);
  const displayName = useDisplayNameLookup();

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Finance invoice #${invoice.id}`}
      description="Buy the right to collect this invoice."
      footer={
        <Button size="lg" className="h-11" disabled={disabled || !enough} onClick={onBuy}>
          Finance for {formatRupiah(invoice.askPrice)}
        </Button>
      }
    >
      <MoneyBridge pay={invoice.askPrice} receive={invoice.faceAmount} dueDate={invoice.dueDate} payNote="now" size="lg" />

      <p className="text-base text-pretty text-ink">
        You pay {formatRupiah(invoice.askPrice)} now. You receive {formatRupiah(invoice.faceAmount)} when{" "}
        {displayName(invoice.buyer)} pays on {formatDate(invoice.dueDate)}.
      </p>

      <ReturnLine faceAmount={invoice.faceAmount} price={invoice.askPrice} dueDate={invoice.dueDate} />

      <dl className="flex flex-col divide-y divide-foreground/[0.07] rounded-lg ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-3">
          <dt className="text-sm text-ink-muted">Seller</dt>
          <dd className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium">
            <AddressName address={invoice.seller} />
            <CreditBadgeChip address={invoice.seller} />
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-3">
          <dt className="text-sm text-ink-muted">Buyer</dt>
          <dd className="text-right text-sm font-medium">
            <AddressName address={invoice.buyer} />
            <span className="block text-xs font-normal text-brand-700">Buyer confirmed this invoice</span>
          </dd>
        </div>
      </dl>

      <BuyerRecordPanel buyer={invoice.buyer} seller={invoice.seller} />

      <p className="flex items-start gap-2.5 rounded-lg bg-warning px-3.5 py-3 text-sm font-medium text-pretty text-warning-foreground">
        <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        If the buyer doesn&apos;t pay, you can lose money. revine. doesn&apos;t guarantee repayment.
      </p>

      {isLoading ? (
        <Skeleton className="h-12 w-full rounded-lg" />
      ) : (
        !enough && <BalanceShortfall need={invoice.askPrice} have={midr} />
      )}
    </ActionSheet>
  );
}
