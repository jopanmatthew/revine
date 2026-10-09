"use client";

import { BatteryFullIcon, LockIcon, SignalIcon, WifiIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { StatusBadge } from "@/components/status-badge";
import { formatPercent, formatRupiah, returnPercent } from "@/lib/format";
import type { InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useCountUp, useReducedMotion } from "./motion";

const CASH_BEFORE = 4_300_000;
const PAID = 9_700_000;

// 0: invoice #12 is listed · 1: Modal Maju buys it on the web · 2: Bu Sari's phone says she got paid
type Phase = 0 | 1 | 2;

const MARKET = [
  { id: 12, seller: "Beras Bu Sari", buyer: "RM Selera Kita", record: "reliable", amount: 10_000_000n, price: 9_700_000n, days: 30 },
  { id: 22, seller: "Konveksi Maju Jaya", buyer: "Hotel Puri Asri", record: "mixed", amount: 8_500_000n, price: 8_245_000n, days: 35 },
  { id: 6, seller: "Toko Rasa Nusantara", buyer: "Katering Ibu Ani", record: "new", amount: 5_000_000n, price: 4_800_000n, days: 45 },
] as const;

const RECORD = {
  reliable: { label: "Reliable payer", className: "bg-brand-700/10 text-brand-700" },
  mixed: { label: "Mixed payer", className: "bg-warning text-warning-foreground" },
  new: { label: "New buyer", className: "text-ink-muted ring-1 ring-foreground/15" },
} as const;

/**
 * The hero's one authored moment: the product, coded from the app's own parts. Once on
 * load, the financier buys invoice #12 in the browser and the seller's phone gets paid. Reduced
 * motion shows the end state.
 */
export function HeroStage() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(0);

  useEffect(() => {
    const bought = setTimeout(() => setPhase(1), 1900);
    const paid = setTimeout(() => setPhase(2), 2600);
    return () => {
      clearTimeout(bought);
      clearTimeout(paid);
    };
  }, []);

  const shown: Phase = reduced ? 2 : phase;
  const counted = useCountUp(CASH_BEFORE, CASH_BEFORE + PAID, shown === 2 && !reduced);
  const cash = reduced ? CASH_BEFORE + PAID : counted;

  return (
    <div
      role="img"
      aria-label="Example: Modal Maju finances Beras Bu Sari's invoice #12 for Rp9.700.000, and Bu Sari's phone shows: You got paid Rp9.700.000."
      data-stage-in
      className="relative mx-auto w-full max-w-5xl px-4 md:pb-56 md:pl-[12.5rem] lg:pl-[14rem]"
    >
      <BrowserWindow phase={shown} />
      <div className="mx-auto w-fit md:absolute md:top-14 md:left-4">
        <Phone phase={shown} cash={cash} />
      </div>
    </div>
  );
}

function BrowserWindow({ phase }: { phase: Phase }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-background shadow-[0_50px_100px_-40px_rgb(0_0_0/0.7)] ring-1 ring-white/15 md:block">
      <div className="grid h-10 grid-cols-[3rem_1fr_3rem] items-center border-b border-foreground/[0.07] bg-card px-4">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-2.5 rounded-full bg-foreground/12" />
          ))}
        </span>
        <span className="mx-auto flex h-6 w-full max-w-64 items-center justify-center gap-1.5 rounded-md bg-muted text-[0.6875rem] text-ink-muted">
          <LockIcon className="size-3" />
          revine. · Financier
        </span>
      </div>

      <div className="bg-brand-900 text-white">
        <div className="flex h-12 items-center justify-between px-5">
          <Logo variant="dark" className="text-lg" />
          <span className="inline-flex rounded-full bg-white/[0.07] p-0.5 text-[0.6875rem] font-medium text-white/70 ring-1 ring-white/10">
            <span className="px-3 py-1">Seller</span>
            <span className="px-3 py-1">Buyer</span>
            <span className="rounded-full bg-white px-3 py-1 text-brand-900">Financier</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.6875rem] font-medium tabular-nums ring-1 ring-white/15">
              Rp82.000.000 mIDR
            </span>
            <span className="flex size-7 items-center justify-center rounded-full bg-mint text-[0.625rem] font-bold text-brand-900">
              MM
            </span>
          </span>
        </div>
        <div className="flex items-end justify-between gap-4 px-5 pt-3 pb-12">
          <span className="flex flex-col gap-1">
            <span className="text-xs text-white/70">
              Hi, <strong className="font-bold text-white">Modal Maju</strong>
            </span>
            <span className="text-[0.6875rem] text-white/55">Expected</span>
            <span
              key={phase >= 1 ? "bought" : "before"}
              className="text-3xl leading-none font-bold tracking-tight tabular-nums motion-safe:animate-[revine-amount-highlight_300ms_var(--ease-out)]"
            >
              {phase >= 1 ? "Rp13.250.000" : "Rp3.250.000"}
            </span>
          </span>
          <span className="flex gap-1.5 text-[0.6875rem] font-medium">
            <span className="rounded-full bg-white px-3 py-1.5 text-brand-900">Marketplace 3</span>
            <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-white/75 ring-1 ring-white/10">Companies</span>
            <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-white/75 ring-1 ring-white/10">Portfolio</span>
          </span>
        </div>
      </div>

      <ul className="relative mx-4 -mt-8 mb-4 overflow-hidden rounded-2xl bg-card shadow-[0_20px_40px_-28px_rgb(11_31_26/0.5)] ring-1 ring-foreground/[0.06]">
        {MARKET.map((row) => {
          const bought = row.id === 12 && phase >= 1;
          const record = RECORD[row.record];
          return (
            <li
              key={row.id}
              data-fresh={bought ? "" : undefined}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto_6.5rem] items-center gap-x-4 border-b border-foreground/[0.07] px-5 py-3.5 last:border-b-0"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">
                {row.seller[0]}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-bold text-ink">{row.seller}</span>
                <span className="flex min-w-0 items-center gap-2 text-xs text-ink-muted">
                  <span className="truncate">
                    Invoice #{row.id} · to {row.buyer}
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-px text-[0.625rem] font-medium", record.className)}>
                    {record.label}
                  </span>
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-bold text-ink tabular-nums">{formatRupiah(row.amount)}</span>
                <span className="text-xs font-medium text-brand-700 tabular-nums">
                  {formatPercent(returnPercent(row.amount, row.price))} in {row.days} days
                </span>
              </span>
              <span className="flex justify-end">
                {bought ? (
                  <StatusBadge status="Financed" role="financier" className="motion-safe:animate-[revine-appear_200ms_var(--ease-out)_both]" />
                ) : (
                  <span className="rounded-full bg-brand-700 px-4 py-1.5 text-xs font-medium text-white">Buy</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const PHONE_LEDGER: { buyer: string; id: number; due: string; amount: bigint; status: InvoiceStatus }[] = [
  { buyer: "RM Selera Kita", id: 12, due: "in 30 days", amount: 10_000_000n, status: "Listed" },
  { buyer: "Kedai Kopi Lestari", id: 11, due: "in 14 days", amount: 4_500_000n, status: "Verified" },
];

function Phone({ phase, cash }: { phase: Phase; cash: number }) {
  const paid = phase === 2;
  return (
    <div className="w-[16.75rem] rounded-[2.6rem] bg-[#040907] p-2 shadow-[0_40px_80px_-28px_rgb(0_0_0/0.75)] ring-1 ring-white/15">
      <div className="relative h-[32.5rem] overflow-hidden rounded-[2.1rem] bg-background">
        <div className="bg-brand-900 text-white">
          <div className="flex h-9 items-center justify-between px-6 text-[0.6875rem] font-bold">
            <span className="tabular-nums">9:41</span>
            <span className="flex items-center gap-1">
              <SignalIcon className="size-3" />
              <WifiIcon className="size-3" />
              <BatteryFullIcon className="size-3.5" />
            </span>
          </div>
          <div className="flex h-11 items-center justify-between px-4">
            <Logo variant="dark" className="text-base" />
            <span className="flex size-7 items-center justify-center rounded-full bg-mint text-[0.625rem] font-bold text-brand-900">
              BS
            </span>
          </div>
          <div className="flex flex-col gap-1 px-4 pt-3 pb-9">
            <span className="text-[0.6875rem] text-white/70">Cash received</span>
            <span className="text-[1.75rem] leading-none font-bold tracking-tight tabular-nums">{formatRupiah(cash)}</span>
            <span className={cn("mt-1 text-[0.6875rem] transition-colors duration-500", paid ? "text-mint" : "text-white/60")}>
              {paid ? "+Rp9.700.000 today, from Modal Maju" : "1 invoice listed for financing"}
            </span>
          </div>
        </div>
        <span className="absolute top-2 left-1/2 h-[1.35rem] w-[5.25rem] -translate-x-1/2 rounded-full bg-black" />

        <ul className="relative mx-2.5 -mt-5 overflow-hidden rounded-2xl bg-card shadow-[0_16px_32px_-24px_rgb(11_31_26/0.5)] ring-1 ring-foreground/[0.06]">
          {PHONE_LEDGER.map((line) => {
            const status = line.id === 12 && paid ? "Financed" : line.status;
            return (
              <li
                key={line.id}
                data-fresh={line.id === 12 && paid ? "" : undefined}
                className="flex items-center justify-between gap-3 border-b border-foreground/[0.07] px-3.5 py-3 last:border-b-0"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[0.8125rem] font-medium text-ink">{line.buyer}</span>
                  <span className="text-[0.6875rem] text-ink-muted">
                    #{line.id} · {line.due}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[0.8125rem] font-bold text-ink tabular-nums">{formatRupiah(line.amount)}</span>
                  <StatusBadge status={status} className="h-4 px-1.5 text-[0.5625rem]" />
                </span>
              </li>
            );
          })}
        </ul>

        <div className="absolute inset-x-4 bottom-6">
          <span className="flex h-10 items-center justify-center rounded-full bg-mint text-[0.8125rem] font-medium text-brand-900">
            + New invoice
          </span>
        </div>
        <span className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-ink/80" />

        <div
          data-state={paid ? "open" : "closed"}
          className="absolute inset-x-2.5 bottom-[4.5rem] rounded-2xl bg-brand-900 px-4 py-3 text-white shadow-[0_18px_36px_-12px_rgb(11_31_26/0.7)] ring-1 ring-mint/35 transition-[transform,opacity] duration-500 ease-(--ease-out) data-[state=closed]:translate-y-5 data-[state=closed]:opacity-0 motion-reduce:transition-none"
        >
          <span className="block text-[0.6875rem] text-white/75">You got paid</span>
          <span className="block text-xl leading-tight font-bold tracking-tight tabular-nums">Rp9.700.000 🎉</span>
          <span className="block text-[0.6875rem] text-white/70">Modal Maju financed invoice #12</span>
        </div>
      </div>
    </div>
  );
}
