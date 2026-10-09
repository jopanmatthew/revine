"use client";

import { ArrowRightIcon, CircleCheckIcon, FingerprintPatternIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useInView, useReducedMotion } from "./motion";
import { ROLE_CHIP, ROLE_DOT, type RoleName } from "./roles";

const STEPS: { role: RoleName; short: string; title: string; line: string; view: ReactNode }[] = [
  {
    role: "Seller",
    short: "Create",
    title: "Create the invoice",
    line: "Line items stay private. Only a fingerprint goes on-chain.",
    view: <CreateView />,
  },
  {
    role: "Buyer",
    short: "Confirm",
    title: "Confirm it's real",
    line: "The buyer checks the details against the fingerprint.",
    view: <ConfirmView />,
  },
  {
    role: "Seller",
    short: "List",
    title: "List it for financing",
    line: "Pick a small discount and see exactly what you get.",
    view: <ListView />,
  },
  {
    role: "Financier",
    short: "Finance",
    title: "Finance it",
    line: "The seller gets paid today.",
    view: <FinanceView />,
  },
  {
    role: "Buyer",
    short: "Repay",
    title: "Pay on the due date",
    line: "The full amount goes to whoever holds the invoice.",
    view: <PayView />,
  },
];

const STEP_MS = 6000;

/**
 * §8.1's five steps as pill tabs over a split panel, each step with the piece of the app it happens
 * in. While the section is in view the tabs advance on their own; choosing a tab hands control to
 * the visitor for good. Reduced motion never advances.
 */
export function HowItWorks() {
  const [index, setIndex] = useState(0);
  const [manual, setManual] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>(0.45);
  const reduced = useReducedMotion();
  const auto = inView && !manual && !reduced;
  const step = STEPS[index];

  useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [auto, index]);

  return (
    <div ref={ref} className="group/how flex flex-col gap-8">
      <Tabs
        value={step.short}
        onValueChange={(value) => {
          setManual(true);
          setIndex(STEPS.findIndex((s) => s.short === value));
        }}
        className="gap-8"
      >
        <TabsList className="mx-auto h-auto w-full flex-wrap justify-center gap-2 bg-transparent p-0">
          {STEPS.map((s, i) => (
            <TabsTrigger
              key={s.short}
              value={s.short}
              className="group/pill relative h-11 flex-none gap-2 overflow-hidden rounded-full border-0 bg-card px-4 text-sm font-medium text-ink-muted ring-1 ring-foreground/10 transition-[color,background-color,box-shadow] duration-200 hover:text-ink data-[state=active]:bg-brand-900 data-[state=active]:text-white data-[state=active]:ring-brand-900"
            >
              {i === index && auto && (
                <span
                  key={index}
                  aria-hidden
                  style={{ animationDuration: `${STEP_MS}ms` }}
                  className="absolute inset-0 origin-left animate-[revine-progress_linear_both] bg-white/14"
                />
              )}
              <span aria-hidden className={cn("relative size-2 rounded-full group-data-[state=active]/pill:ring-1 group-data-[state=active]/pill:ring-white/60", ROLE_DOT[s.role])} />
              <span className="relative tabular-nums">
                {i + 1}. {s.short}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {STEPS.map((s, i) => (
          <TabsContent key={s.short} value={s.short}>
            <div className="grid overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="flex flex-col justify-center gap-4 px-6 py-8 sm:px-10 sm:py-12 motion-safe:animate-[revine-swap_360ms_var(--ease-out)_both]">
                <span className="text-sm text-ink-muted tabular-nums">
                  Step {i + 1} of {STEPS.length}
                </span>
                <h3 className="text-3xl leading-tight font-bold tracking-tight text-balance text-ink sm:text-4xl">{s.title}</h3>
                <p className="text-lg text-pretty text-ink-muted">{s.line}</p>
                <span className={cn("mt-1 w-fit rounded-full px-3 py-1 text-xs font-bold", ROLE_CHIP[s.role])}>
                  {s.role}
                </span>
              </div>
              <div className="flex min-h-[22rem] items-center justify-center bg-brand-900 px-5 py-10 sm:min-h-[25rem] sm:px-10">
                <div data-step-view className="w-full max-w-sm motion-safe:animate-[revine-swap_420ms_var(--ease-out)_60ms_both]">{s.view}</div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ViewCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-2xl bg-card text-ink shadow-[0_28px_56px_-28px_rgb(0_0_0/0.7)] ring-1 ring-black/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CreateView() {
  return (
    <ViewCard>
      <div className="flex flex-col gap-0.5 px-5 pt-5">
        <span className="font-bold">New invoice</span>
        <span className="text-xs text-ink-muted">to RM Selera Kita · due in 30 days</span>
      </div>
      <ul className="mt-3 border-y border-foreground/[0.07] text-sm">
        {[
          ["Beras premium 5 kg", "100 × Rp75.000", "Rp7.500.000"],
          ["Minyak goreng 2 L", "50 × Rp50.000", "Rp2.500.000"],
        ].map(([item, qty, total]) => (
          <li key={item} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-foreground/[0.07] px-5 py-2.5 last:border-b-0">
            <span className="truncate">{item}</span>
            <span className="font-medium tabular-nums">{total}</span>
            <span className="text-xs text-ink-muted tabular-nums">{qty}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between px-5 py-3.5">
        <span className="text-sm text-ink-muted">Total</span>
        <span data-print className="text-xl font-bold tabular-nums">
          Rp10.000.000
        </span>
      </div>
      <div className="flex items-center gap-2.5 bg-muted/60 px-5 py-3 text-xs">
        <FingerprintPatternIcon className="size-4 text-brand-700" />
        <span className="text-ink-muted">On-chain: the fingerprint only</span>
        <span className="ml-auto font-mono whitespace-nowrap text-ink">0x8f3a…c21e</span>
      </div>
    </ViewCard>
  );
}

function ConfirmView() {
  return (
    <ViewCard className="px-5 py-5">
      <span className="text-sm text-ink-muted">Beras Bu Sari sent you an invoice</span>
      <span data-print className="mt-1 block text-3xl font-bold tracking-tight tabular-nums">
        Rp10.000.000
      </span>
      <span className="text-sm text-ink-muted">Invoice #12 · due in 30 days</span>
      <p className="mt-4 flex items-center gap-2 rounded-lg bg-brand-700/10 px-3 py-2.5 text-sm font-medium text-brand-700">
        <CircleCheckIcon className="size-4 shrink-0" />
        Details match the fingerprint on-chain
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <span className="flex h-10 items-center justify-center rounded-full text-sm font-medium ring-1 ring-foreground/15">Reject</span>
        <span className="flex h-10 items-center justify-center rounded-full bg-brand-700 text-sm font-medium text-white">Confirm</span>
      </div>
    </ViewCard>
  );
}

function ListView() {
  return (
    <ViewCard className="flex flex-col gap-4 px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold">Get financed</span>
        <StatusBadge status="Listed" />
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">Discount</span>
          <span className="text-2xl font-bold text-brand-700 tabular-nums">3%</span>
        </div>
        <span className="relative h-1.5 rounded-full bg-muted">
          <span className="absolute inset-y-0 left-0 w-[22%] rounded-full bg-brand-700" />
          <span className="absolute top-1/2 left-[22%] size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-700 bg-white" />
        </span>
        <span className="flex justify-between text-xs text-ink-muted">
          <span>1%</span>
          <span>10%</span>
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-xl bg-muted/70 px-4 py-3.5">
        <span className="text-sm text-ink-muted">You receive today</span>
        <span data-print className="text-3xl font-bold tracking-tight tabular-nums">
          Rp9.700.000
        </span>
        <span className="text-xs text-ink-muted">Financier earns Rp300.000 (3,09% in 30 days)</span>
      </div>
    </ViewCard>
  );
}

function FinanceView() {
  return (
    <ViewCard>
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">B</span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">Beras Bu Sari</span>
          <span className="truncate text-xs text-ink-muted">Invoice #12 · to RM Selera Kita</span>
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-brand-700/10 px-2 py-0.5 text-[0.6875rem] font-medium text-brand-700">
          Reliable payer
        </span>
      </div>
      <div className="flex items-end justify-between gap-3 px-5 pt-4">
        <span className="flex flex-col">
          <span className="text-xs text-ink-muted">Buyer pays you on day 30</span>
          <span className="text-2xl font-bold tracking-tight tabular-nums">Rp10.000.000</span>
        </span>
        <span data-print className="text-sm font-bold text-brand-700 tabular-nums">
          +3,09%
        </span>
      </div>
      <div className="px-5 pt-4 pb-5">
        <span className="flex h-11 items-center justify-center rounded-full bg-brand-700 text-sm font-medium text-white">
          Buy for Rp9.700.000
        </span>
      </div>
      <p className="flex items-center gap-2 bg-mint/15 px-5 py-3 text-xs font-medium text-brand-900">
        <ArrowRightIcon className="size-3.5 shrink-0" />
        Rp9.700.000 goes to Bu Sari&apos;s wallet, now.
      </p>
    </ViewCard>
  );
}

function PayView() {
  return (
    <ViewCard className="flex flex-col gap-4 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-sm text-ink-muted">RM Selera Kita pays</span>
          <span data-print className="text-3xl font-bold tracking-tight tabular-nums">
            Rp10.000.000
          </span>
        </span>
        <StatusBadge status="Paid" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm">
        <span className="flex flex-col rounded-lg bg-muted/70 px-3 py-2.5">
          <span className="text-[0.6875rem] text-ink-muted">From the buyer</span>
          <span className="truncate font-medium">RM Selera Kita</span>
        </span>
        <ArrowRightIcon className="size-4 text-brand-700" />
        <span className="flex flex-col rounded-lg bg-brand-700/10 px-3 py-2.5">
          <span className="text-[0.6875rem] text-brand-700">To the holder</span>
          <span className="truncate font-medium">Modal Maju</span>
        </span>
      </div>
      <p className="text-xs text-ink-muted">Sent straight to whoever holds invoice #12. No reconciliation.</p>
    </ViewCard>
  );
}
