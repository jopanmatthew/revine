import { ArrowRightIcon, EyeOffIcon, GlobeIcon, LockIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { Logo } from "@/components/logo";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/lib/config";
import type { Role } from "@/lib/invoice";
import { cn } from "@/lib/utils";

import { ExampleCalculator } from "./_landing/example-calculator";
import { HeroStage } from "./_landing/hero-stage";
import { HowItWorks } from "./_landing/how-it-works";
import { PrivacyDemo } from "./_landing/privacy-demo";
import { ROLE_CHIP, type RoleName } from "./_landing/roles";

// Landing (PRD §9.2), Pluang-inspired: a centered hero over the product itself, then the example as
// a calculator, the steps as tabs, the roles as three views of one invoice. The mark's slanted
// planes stay in the hero only (§10.1).

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero. The product stage hangs over the hero's bottom edge into the page. */}
      <section className="relative isolate overflow-x-clip bg-brand-900 text-white">
        <HeroPlanes />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 pb-14 text-center sm:pt-20 sm:pb-16">
          <p
            data-hero-in
            style={{ "--i": 0 } as CSSProperties}
            className="rounded-full bg-white/[0.07] px-4 py-1.5 text-sm font-medium text-white/80 ring-1 ring-white/10"
          >
            Turn invoices into opportunities.
          </p>
          <h1
            data-hero-in
            style={{ "--i": 1 } as CSSProperties}
            className="mt-7 max-w-5xl text-[2.75rem] leading-[1.02] font-normal tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
          >
            Get paid <span className="font-bold text-mint">today</span> for invoices due{" "}
            <span className="font-bold">next month</span>.
          </h1>
          <p
            data-hero-in
            style={{ "--i": 2 } as CSSProperties}
            className="mt-6 max-w-2xl text-lg text-pretty text-white/75 sm:text-xl"
          >
            Sell an unpaid invoice for cash today. Buyers check private details against a fingerprint, while each
            transfer of ownership is recorded on Ethereum.
          </p>
          <div data-hero-in style={{ "--i": 3 } as CSSProperties} className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full bg-mint px-7 text-base text-brand-900 hover:bg-white">
              <Link href="/app">
                Launch app
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/25 bg-transparent px-7 text-base text-white hover:bg-white/10 hover:text-white"
            >
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
        </div>
        <div className="relative z-10 -mb-[19rem] md:-mb-[22rem]">
          <HeroStage />
        </div>
      </section>

      {/* 2. Example card, as a calculator */}
      <section aria-label="Example" className="mx-auto w-full max-w-6xl px-4 pt-[24rem] pb-28 md:pt-[28rem] sm:pb-36">
        <p className="mb-5 text-xs font-bold tracking-[0.16em] text-brand-700 uppercase">A simple example</p>
        <ExampleCalculator />
      </section>

      {/* 3. How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-28 sm:pb-36">
        <SectionHeading eyebrow="The process" title="How it works" lede="Five steps, three roles, one invoice. Watch it move, or pick a step." />
        <div className="mt-10">
          <HowItWorks />
        </div>
      </section>

      {/* 4. Three roles, as three views of the same invoice */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-28 sm:pb-36">
        <SectionHeading
          eyebrow="One shared record"
          title="One invoice, three views."
          lede="Roles are views, not accounts: any wallet can use any of them. Here is invoice #12 as each one sees it."
        />
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {VIEWS.map((view) => (
            <RoleView key={view.role} {...view} />
          ))}
        </div>
      </section>

      {/* 5. Why on-chain */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-28 sm:pb-36 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div className="flex flex-col gap-3 lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink sm:text-5xl">Why on-chain</h2>
          <p className="max-w-sm text-lg text-pretty text-ink-muted">
            Three promises a spreadsheet can&apos;t keep, kept by the contract on Ethereum.
          </p>
        </div>
        <div className="flex flex-col border-t border-foreground/10">
          <Reason title="Clear ownership" line="Anyone can see who holds the right to collect an invoice.">
            <FragmentRow label="Invoice #12" value={<StatusBadge status="Financed" />} />
            <FragmentRow label="Current holder" value="Modal Maju" strong />
          </Reason>
          <Reason title="No double-selling" line="The same invoice can't be sold twice on revine.">
            <FragmentRow label="Invoice #12" value={<StatusBadge status="Financed" />} />
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <LockIcon className="size-3.5" aria-hidden />
              Already financed. It can&apos;t be listed again.
            </p>
          </Reason>
          <Reason title="Automatic payment" line="The buyer's payment goes straight to whoever holds the invoice.">
            <FragmentRow label="RM Selera Kita paid" value="Rp10.000.000" strong />
            <p className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
              <ArrowRightIcon className="size-3.5" aria-hidden />
              Sent to Modal Maju, no reconciliation
            </p>
          </Reason>
        </div>
      </section>

      {/* 6. Private by design */}
      <section id="privacy" className="mx-auto w-full max-w-6xl scroll-mt-28 px-4 pb-28 sm:pb-36">
        <div className="grid overflow-hidden rounded-3xl ring-1 ring-foreground/10 lg:grid-cols-2">
          <div className="flex flex-col gap-6 bg-card px-6 py-10 sm:px-10 sm:py-14">
            <h2 className="text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink sm:text-5xl">
              Private by design.
            </h2>
            <p className="text-lg text-pretty text-ink-muted">
              Line items and descriptions stay off-chain. The buyer checks them against a fingerprint on the public
              invoice record; the private details themselves are never published.
            </p>
            <div className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <ListOf
                icon={<GlobeIcon />}
                title="Public on-chain"
                items={["Invoice amount and due date", "Seller, buyer and financier addresses", "A fingerprint of the details"]}
              />
              <ListOf hidden icon={<LockIcon />} title="Never on-chain" items={["Line items and prices", "The description", "Your exact revenue"]} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-5 bg-brand-900 px-5 py-12 sm:px-10">
            <PrivacyDemo />
            <p className="flex max-w-sm items-center gap-2 text-sm text-white/70">
              <ShieldCheckIcon className="size-4 shrink-0 text-mint" aria-hidden />
              Financiers see &quot;Revenue above Rp100 jt&quot;, never the number.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Footer, opening with the brand board's supporting line */}
      <footer className="mt-auto bg-brand-900 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] sm:pt-28">
          <div className="flex flex-col items-start gap-8 border-b border-white/10 pb-14 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-3xl text-5xl leading-[1.02] font-normal tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
              Capital today. <span className="font-bold text-mint">Growth tomorrow.</span>
            </h2>
            <Button asChild size="lg" className="h-12 shrink-0 rounded-full bg-mint px-7 text-base text-brand-900 hover:bg-white">
              <Link href="/app">
                Launch app
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-6 pt-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <Logo variant="dark" className="text-3xl" />
              <p className="text-sm text-white/70">Turn invoices into opportunities.</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-white/60 sm:items-end">
              <p>Testnet demo on Sepolia. No real money. Built for ETHJKT.</p>
              {GITHUB_URL && (
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="font-medium text-mint underline-offset-4 hover:underline">
                  GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** The mark's slanted parallelograms as large hero shapes, framing the centered copy. */
function HeroPlanes() {
  const plane =
    "absolute -skew-x-[36deg] rounded-[2.25rem] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-1000 motion-safe:ease-(--ease-out)";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className={cn(
          plane,
          "top-[5%] -right-[30%] h-[22%] w-[62%] bg-linear-to-r from-brand-700/60 to-mint/75 motion-safe:slide-in-from-right-16 md:-right-[12%] md:w-[40%]",
        )}
      />
      <div
        className={cn(
          plane,
          "top-[30%] -left-[34%] h-[18%] w-[58%] bg-linear-to-r from-mint/45 to-brand-700/70 motion-safe:delay-150 motion-safe:slide-in-from-left-16 md:-left-[14%] md:w-[34%]",
        )}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_2%,var(--brand-900)_30%,var(--brand-900)_70%,transparent_98%)]" />
    </div>
  );
}

function SectionHeading({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <div className="flex flex-col justify-between gap-5 border-t border-foreground/10 pt-5 sm:flex-row sm:items-end sm:gap-10">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-[0.16em] text-brand-700 uppercase">{eyebrow}</span>
        <h2 className="text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink sm:text-5xl">{title}</h2>
      </div>
      <p className="max-w-md text-lg text-pretty text-ink-muted">{lede}</p>
    </div>
  );
}

const VIEWS: {
  role: RoleName;
  view: Role;
  href: string;
  line: string;
  label: string;
  figure: string;
  note: string;
  noteAccent?: boolean;
  counterpart: string;
}[] = [
  {
    role: "Seller",
    view: "seller",
    href: "/seller",
    line: "Gets paid now for invoices customers pay later.",
    label: "Cash received",
    figure: "Rp9.700.000",
    note: "Paid today, 30 days early",
    noteAccent: true,
    counterpart: "to RM Selera Kita",
  },
  {
    role: "Buyer",
    view: "buyer",
    href: "/buyer",
    line: "Confirms invoices sent to them, then pays on the due date.",
    label: "You owe",
    figure: "Rp10.000.000",
    note: "Due in 30 days, payable to Modal Maju",
    counterpart: "from Beras Bu Sari",
  },
  {
    role: "Financier",
    view: "financier",
    href: "/financier",
    line: "Finances verified invoices and earns a short-term return.",
    label: "Expected",
    figure: "Rp10.000.000",
    note: "+Rp300.000 profit (3,09%) in 30 days",
    noteAccent: true,
    counterpart: "Beras Bu Sari → RM Selera Kita",
  },
];

function RoleView({ role, view, href, line, label, figure, note, noteAccent, counterpart }: (typeof VIEWS)[number]) {
  return (
    <div className="flex flex-col gap-5">
      <div aria-hidden className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 bg-brand-900 px-5 pt-5 pb-6 text-white">
          <span className="text-xs text-white/70">{label}</span>
          <span className="text-3xl leading-tight font-bold tracking-tight tabular-nums">{figure}</span>
          <span className={cn("text-xs", noteAccent ? "text-mint" : "text-white/65")}>{note}</span>
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-bold text-ink">Invoice #12</span>
            <span className="truncate text-xs text-ink-muted">{counterpart}</span>
          </span>
          <StatusBadge status="Financed" role={view} className="shrink-0" />
        </div>
      </div>
      <div className="flex flex-col items-start gap-2.5">
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", ROLE_CHIP[role])}>{role}</span>
        <p className="text-base text-pretty text-ink">{line}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          Open the {role.toLowerCase()} view
          <ArrowRightIcon className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function Reason({ title, line, children }: { title: string; line: string; children: ReactNode }) {
  return (
    <div className="grid gap-5 border-b border-foreground/10 py-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-10">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-2xl font-bold tracking-tight text-ink">{title}</h3>
        <p className="text-base text-pretty text-ink-muted">{line}</p>
      </div>
      <div aria-hidden className="flex flex-col gap-2.5 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        {children}
      </div>
    </div>
  );
}

function FragmentRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className={cn("tabular-nums", strong ? "font-bold text-ink" : "text-ink")}>{value}</span>
    </div>
  );
}

function ListOf({ icon, title, items, hidden }: { icon: ReactNode; title: string; items: string[]; hidden?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
        <span className={cn("[&_svg]:size-4", hidden ? "text-ink-muted" : "text-brand-700")}>{icon}</span>
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-base text-ink">
            {hidden ? (
              <EyeOffIcon className="mt-1 size-4 shrink-0 text-ink-muted" aria-hidden />
            ) : (
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-700" aria-hidden />
            )}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
