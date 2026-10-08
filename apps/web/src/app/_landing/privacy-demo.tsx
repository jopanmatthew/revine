"use client";

import { GlobeIcon, LockIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { useInView } from "./motion";

const ITEMS = [
  ["Beras premium 5 kg", "Rp7.500.000", "100 × Rp75.000"],
  ["Minyak goreng 2 L", "Rp2.500.000", "50 × Rp50.000"],
] as const;

/**
 * Private by design (§9.2), shown rather than told: when the section is seen, the line items are
 * blacked out bar by bar and the fingerprint is written to the on-chain record. Before that (and
 * with reduced motion, after it) the invoice reads plainly.
 */
export function PrivacyDemo() {
  const [ref, inView] = useInView<HTMLDivElement>(0.5);

  return (
    <div ref={ref} data-in={inView ? "" : undefined} aria-hidden className="flex w-full max-w-sm flex-col gap-3">
      <div className="overflow-hidden rounded-2xl bg-card text-ink shadow-[0_28px_56px_-28px_rgb(0_0_0/0.7)]">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <span className="flex flex-col">
            <span className="font-bold">Invoice #12</span>
            <span className="text-xs text-ink-muted">Beras Bu Sari → RM Selera Kita</span>
          </span>
          <span className="flex items-center gap-1 text-[0.6875rem] font-medium text-ink-muted">
            <LockIcon className="size-3" />
            Off-chain
          </span>
        </div>
        <ul className="border-y border-foreground/[0.07] text-sm">
          {ITEMS.map((cells, row) => (
            <li
              key={cells[0]}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-foreground/[0.07] px-5 py-2.5 last:border-b-0"
            >
              {cells.map((cell, col) => (
                <span
                  key={cell}
                  className={col === 1 ? "justify-self-end tabular-nums" : col === 2 ? "text-xs text-ink-muted tabular-nums" : "min-w-0"}
                >
                  <span className="relative inline-block">
                    {cell}
                    <span
                      data-redact
                      style={{ "--i": row * 3 + col } as CSSProperties}
                      className="absolute -inset-x-1 inset-y-px rounded-[3px] bg-ink"
                    />
                  </span>
                </span>
              ))}
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between px-5 py-3.5">
          <span className="text-sm text-ink-muted">Total</span>
          <span className="text-lg font-bold tabular-nums">Rp10.000.000</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl bg-white/[0.06] px-5 py-4 text-sm text-white ring-1 ring-white/10">
        <span className="flex items-center gap-1.5 text-xs font-bold text-mint">
          <GlobeIcon className="size-3.5" />
          On-chain record
        </span>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
          <dt className="text-white/60">Amount</dt>
          <dd className="justify-self-end font-bold tabular-nums">Rp10.000.000</dd>
          <dt className="text-white/60">Due</dt>
          <dd className="justify-self-end tabular-nums">in 30 days</dd>
          <dt className="text-white/60">Fingerprint</dt>
          <dd className="justify-self-end font-mono text-mint">
            <span data-type className="inline-block">
              0x8f3a…c21e
            </span>
          </dd>
        </dl>
      </div>
    </div>
  );
}
