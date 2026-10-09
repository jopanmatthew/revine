"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  annualizedReturn,
  formatPercent,
  formatRupiah,
  priceFromDiscount,
  profitOf,
  returnPercent,
} from "@/lib/format";

const TERMS = ["14", "30", "60", "90"] as const;
type Term = (typeof TERMS)[number];

/**
 * §9.2's example card as a working calculator. The sentence is the PRD's example at the defaults
 * and rewrites itself as the numbers change; the math is the app's own (§7, §9.6).
 */
export function ExampleCalculator() {
  const [juta, setJuta] = useState(10);
  const [term, setTerm] = useState<Term>("30");
  const [discount, setDiscount] = useState(3);

  const amount = BigInt(Math.round(juta * 1_000_000));
  const days = Number(term);
  const price = priceFromDiscount(amount, discount);
  const profit = profitOf(amount, price);
  const ret = returnPercent(amount, price);
  const yearly = annualizedReturn(ret, days);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:items-center lg:gap-16">
      <div className="flex flex-col gap-8">
        <h2 className="text-[2rem] leading-[1.12] font-normal tracking-[-0.03em] text-balance text-ink sm:text-[2.75rem] sm:leading-[1.08]">
          <strong className="font-bold tabular-nums">{formatRupiah(amount)}</strong> invoice, due in{" "}
          <strong className="font-bold whitespace-nowrap tabular-nums">{days} days</strong>{" "}
          <span className="whitespace-nowrap">
            → <strong className="font-bold text-brand-700 tabular-nums">{formatRupiah(price)}</strong>
          </span>{" "}
          in your wallet today.
        </h2>

        <div className="flex flex-col gap-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <Field label="Invoice amount" value={formatRupiah(amount)} scale={["Rp1 jt", "Rp100 jt"]}>
            <Slider
              min={1}
              max={100}
              step={0.5}
              value={[juta]}
              onValueChange={([next]) => setJuta(next)}
              aria-label="Invoice amount"
              aria-valuetext={formatRupiah(amount)}
            />
          </Field>
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-ink">Due in</span>
            <SegmentedControl
              label="Due in"
              value={term}
              onChange={setTerm}
              options={TERMS.map((value) => ({ value, label: `${value} days` }))}
              className="flex w-full"
            />
          </div>
          <Field label="Discount" value={formatPercent(discount)} scale={["1%", "10%"]}>
            <Slider
              min={1}
              max={10}
              step={0.5}
              value={[discount]}
              onValueChange={([next]) => setDiscount(next)}
              aria-label="Discount"
              aria-valuetext={formatPercent(discount)}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-3xl bg-brand-900 text-white shadow-[0_30px_60px_-30px_rgb(11_31_26/0.6)]">
        <div className="flex flex-col gap-1.5 px-6 pt-7 pb-7 sm:px-8 sm:pt-8">
          <span className="text-sm text-white/70">You receive today</span>
          <span className="text-[clamp(1.5rem,8vw,2.75rem)] leading-none font-bold tracking-tight tabular-nums sm:text-5xl">
            {formatRupiah(price)}
          </span>
          <span className="mt-1 text-sm text-white/65">
            {formatPercent(discount)} less than the invoice, {days} days sooner.
          </span>
        </div>
        <dl className="flex flex-col border-t border-white/10 px-6 text-sm sm:px-8">
          <Line when="Today" label="Financier pays you" value={formatRupiah(price)} />
          <Line when={`Day ${days}`} label="Buyer pays the financier" value={formatRupiah(amount)} />
          <Line
            when="Return"
            label={yearly === null ? "Financier earns" : `Financier earns (≈${formatPercent(yearly, 1)} a year)`}
            value={`+${formatRupiah(profit)} · ${formatPercent(ret)}`}
            accent
          />
        </dl>
        <div className="px-6 pt-2 pb-7 sm:px-8 sm:pb-8">
          <Button asChild className="h-12 w-full rounded-full bg-mint text-base text-brand-900 hover:bg-white">
            <Link href="/app">
              Try it in the app
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  scale,
  children,
}: {
  label: string;
  value: string;
  scale: [string, string];
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-lg font-bold text-ink tabular-nums">{value}</span>
      </div>
      {children}
      <div className="flex justify-between text-xs text-ink-muted tabular-nums" aria-hidden>
        <span>{scale[0]}</span>
        <span>{scale[1]}</span>
      </div>
    </div>
  );
}

function Line({ when, label, value, accent }: { when: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-white/10 py-3.5 last:border-b-0">
      <dt className="contents">
        <span className="text-xs text-white/55 tabular-nums">{when}</span>
        <span className="text-white/85">{label}</span>
      </dt>
      <dd className={accent ? "font-bold text-mint tabular-nums" : "font-bold tabular-nums"}>{value}</dd>
    </div>
  );
}
