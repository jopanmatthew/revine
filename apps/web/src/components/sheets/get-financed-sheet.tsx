"use client";

import { useState } from "react";

import { ActionSheet } from "@/components/action-sheet";
import { AddressName } from "@/components/address-name";
import { RupiahAmount } from "@/components/rupiah-amount";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  daysToDue,
  formatDate,
  formatPercent,
  formatRupiah,
  priceFromDiscount,
  profitOf,
  returnPercent,
} from "@/lib/format";
import type { Invoice } from "@/lib/types";

const DEFAULT_DISCOUNT = 3;

/** Get financed (§9.6): pick a discount, see exactly what you get today, list it. */
export function GetFinancedSheet({
  invoice,
  open,
  onOpenChange,
  onList,
  disabled,
}: {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onList: (askPrice: bigint) => void;
  disabled: boolean; // wrong network
}) {
  const [discount, setDiscount] = useState(DEFAULT_DISCOUNT);
  const price = priceFromDiscount(invoice.faceAmount, discount);
  const profit = profitOf(invoice.faceAmount, price);
  const days = daysToDue(invoice.dueDate);

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Get financed · #${invoice.id}`}
      description={
        <>
          Owed by <AddressName address={invoice.buyer} className="font-medium text-ink" />
        </>
      }
      footer={
        <Button size="lg" className="h-11" disabled={disabled} onClick={() => onList(price)}>
          List for financing
        </Button>
      }
    >
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-foreground/10 ring-1 ring-foreground/10">
        {[
          ["Invoice amount", <RupiahAmount key="a" value={invoice.faceAmount} />],
          ["Due", formatDate(invoice.dueDate)],
          ["Days left", `${days} ${days === 1 ? "day" : "days"}`],
        ].map(([label, value]) => (
          <div key={label as string} className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
            <dt className="text-[0.6875rem] font-medium text-ink-muted">{label}</dt>
            <dd className="text-sm font-bold text-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="discount" className="text-sm font-medium text-ink">
            Discount
          </label>
          <span className="text-2xl font-bold text-brand-700 tabular-nums">{formatPercent(discount)}</span>
        </div>
        <Slider
          id="discount"
          min={1}
          max={10}
          step={0.5}
          value={[discount]}
          onValueChange={([next]) => setDiscount(next)}
          aria-label="Discount"
          aria-valuetext={formatPercent(discount)}
        />
        <div className="flex justify-between text-xs text-ink-muted tabular-nums" aria-hidden>
          <span>1%</span>
          <span>10%</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-xl bg-brand-900 px-4 py-4 text-white">
        <span className="text-sm text-white/70">You receive today</span>
        <RupiahAmount value={price} className="text-4xl font-bold tracking-tight" />
        <span className="mt-1 text-sm text-white/70">
          Financier earns: <span className="font-medium text-mint">{formatRupiah(profit)}</span> (
          {formatPercent(returnPercent(invoice.faceAmount, price))} in {days} {days === 1 ? "day" : "days"})
        </span>
      </div>

      <p className="text-sm text-ink-muted">To change the price later, unlist it and list it again.</p>
    </ActionSheet>
  );
}
