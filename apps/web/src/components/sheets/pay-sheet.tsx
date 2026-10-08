"use client";

import { ActionSheet } from "@/components/action-sheet";
import { BalanceShortfall, useCanAfford } from "@/components/balance-check";
import { DueText } from "@/components/due-text";
import { RupiahAmount } from "@/components/rupiah-amount";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { displayName, sameAddress } from "@/lib/demo-names";
import { formatRupiah } from "@/lib/format";
import type { Invoice } from "@/lib/types";

/** Pay sheet (§9.8): the full amount, to whoever holds the invoice right now. */
export function PaySheet({
  invoice,
  open,
  onOpenChange,
  onPay,
  disabled,
}: {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPay: () => void;
  disabled: boolean; // wrong network
}) {
  const { midr, isLoading, enough } = useCanAfford(invoice.faceAmount);
  // Read live from the store, so the payee is the holder at the moment the sheet is on screen.
  const holder = invoice.holder ?? invoice.seller;
  const sold = !sameAddress(holder, invoice.seller);

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Pay invoice #${invoice.id}`}
      description={<>From {displayName(invoice.seller)}</>}
      footer={
        <Button size="lg" className="h-11" disabled={disabled || !enough} onClick={onPay}>
          Pay {formatRupiah(invoice.faceAmount)}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <RupiahAmount value={invoice.faceAmount} className="text-4xl font-bold tracking-tight" />
        <p className="text-base text-pretty text-ink">
          You pay {formatRupiah(invoice.faceAmount)} to <strong className="font-bold">{displayName(holder)}</strong>{" "}
          (current invoice holder).
        </p>
        <DueText dueDate={invoice.dueDate} />
      </div>

      {sold && (
        <p className="rounded-lg bg-muted px-3.5 py-3 text-sm text-pretty text-ink-muted">
          {displayName(invoice.seller)} sold this invoice to {displayName(holder)}, so your payment goes to them. Same
          amount, same due date.
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-12 w-full rounded-lg" />
      ) : (
        !enough && <BalanceShortfall need={invoice.faceAmount} have={midr} />
      )}
    </ActionSheet>
  );
}
