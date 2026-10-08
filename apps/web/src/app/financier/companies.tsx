"use client";

import { ArrowRightIcon, ThumbsUpIcon, TimerIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ActionSheet } from "@/components/action-sheet";
import { CreditBadgeChip } from "@/components/credit-badge-chip";
import { LedgerEmpty, LedgerSkeleton } from "@/components/ledger";
import { panelClass } from "@/components/page";
import { RupiahAmount } from "@/components/rupiah-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  companyProfiles,
  invoiceOutcome,
  isClosed,
  rankProfiles,
  type CompanyProfile,
  type OutcomeKind,
} from "@/lib/company-profiles";
import { displayName, sameAddress } from "@/lib/demo-names";
import { formatDateTime, formatPercent, formatRupiah, nowSeconds } from "@/lib/format";
import { useInvoices, useProfileAds } from "@/lib/hooks";
import { lastActivity } from "@/lib/invoice";
import type { Address, Invoice } from "@/lib/types";
import { cn } from "@/lib/utils";

function percent(rate: number | null) {
  return rate === null ? "—" : formatPercent(rate * 100, 0);
}

function timeToFinance(days: number | null) {
  if (days === null) return "Not financed yet";
  if (days < 1) return "Financed within a day";
  const whole = Math.round(days);
  return `~${whole} ${whole === 1 ? "day" : "days"} to get financed`;
}

/**
 * Companies tab (PRD §9.9): one row per seller, laid out like a P2P merchant list. Paid profile ads
 * pin to the top with an Ad label; [See] opens the company's closed-invoice record.
 */
export function CompanyList() {
  const { invoices, isLoading } = useInvoices();
  const { ads, isLoading: adsLoading } = useProfileAds();
  const [seller, setSeller] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);

  const ranked = useMemo(() => {
    const now = nowSeconds();
    return rankProfiles(companyProfiles(invoices, now), ads, now);
  }, [invoices, ads]);

  if (isLoading || adsLoading) return <LedgerSkeleton rows={3} />;
  if (ranked.length === 0) return <LedgerEmpty title="No companies on revine. yet." />;

  return (
    <div className="flex flex-col gap-3">
      <ul className={panelClass}>
        {ranked.map(({ profile, ad }) => (
          <CompanyRow
            key={profile.seller}
            profile={profile}
            sponsored={!!ad}
            onSee={() => {
              setSeller(profile.seller);
              setOpen(true);
            }}
          />
        ))}
      </ul>
      <p className="px-1 text-xs text-ink-muted">
        Rows marked <span className="font-medium text-ink">Ad</span> are paid placements. Ads only change the order,
        never a company&apos;s record.
      </p>
      {seller && <CompanyRecordSheet key={seller} seller={seller} open={open} onOpenChange={setOpen} />}
    </div>
  );
}

function CompanyRow({
  profile,
  sponsored,
  onSee,
}: {
  profile: CompanyProfile;
  sponsored: boolean;
  onSee: () => void;
}) {
  const name = displayName(profile.seller);
  const initial = (name.startsWith("0x") ? name.slice(2, 3) : name.slice(0, 1)).toUpperCase();

  return (
    <li
      className={cn(
        "flex flex-col gap-3 border-b border-foreground/[0.07] px-4 py-5 last:border-b-0 sm:px-6",
        sponsored && "bg-mint/[0.06]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">
          {initial}
          {profile.openCount > 0 && (
            <span
              className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-mint ring-2 ring-card"
              aria-label="Has an invoice open for financing"
            />
          )}
        </span>
        <span className="truncate text-lg font-bold text-ink">{name}</span>
        {sponsored && (
          <Badge variant="outline" className="shrink-0 border-ink-muted/40 font-bold text-ink-muted">
            Ad
          </Badge>
        )}
      </div>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
        <span>
          Financed <span className="font-medium text-ink tabular-nums">{profile.financed}</span> (
          {percent(profile.repaidOnTimeRate)} repaid on time)
        </span>
        <span aria-hidden className="hidden h-3.5 w-px bg-foreground/15 sm:block" />
        <span className="inline-flex items-center gap-1">
          <ThumbsUpIcon className="size-3.5" aria-hidden />
          {percent(profile.confirmedRate)} confirmed by buyers
        </span>
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <RupiahAmount value={profile.financedVolume} className="text-[1.75rem] leading-none font-bold tracking-tight text-ink sm:text-3xl" />
            <span className="text-sm text-ink-muted">financed</span>
          </p>
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink-muted">Invoices</dt>
              <dd className="font-medium text-ink tabular-nums">
                {formatRupiah(profile.minInvoice)} – {formatRupiah(profile.maxInvoice)}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink-muted">Open now</dt>
              <dd className="font-medium text-ink tabular-nums">
                {profile.openCount > 0 ? formatRupiah(profile.openAmount) : "—"}
              </dd>
            </div>
          </dl>
          <CreditBadgeChip address={profile.seller} hideIfNone className="mt-1" />
        </div>

        <div className="flex flex-col items-end gap-1.5 text-right">
          <span className="text-xs text-ink-muted">Main buyers</span>
          {profile.topBuyers.map((buyer) => (
            <span key={buyer} className="flex items-center gap-1.5 text-sm text-ink">
              {displayName(buyer)}
              <span aria-hidden className="h-3 w-1 rounded-full bg-brand-700/40" />
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <TimerIcon className="size-3.5" aria-hidden />
            {timeToFinance(profile.avgDaysToFinance)}
          </span>
          <Button className="mt-1 h-11 w-28 text-base sm:h-10" onClick={onSee}>
            See
          </Button>
        </div>
      </div>
    </li>
  );
}

const OUTCOME_STYLE: Record<OutcomeKind, { badge: string; reason: string }> = {
  repaid: { badge: "border-brand-700/20 bg-brand-700/10 text-brand-700", reason: "bg-muted/60 text-ink" },
  "repaid-late": { badge: "bg-warning text-warning-foreground", reason: "bg-warning text-warning-foreground" },
  financed: { badge: "border-foreground/15 text-ink", reason: "bg-muted/60 text-ink" },
  defaulted: { badge: "bg-danger/10 text-danger", reason: "bg-danger/10 text-danger" },
  rejected: { badge: "bg-danger/10 text-danger", reason: "bg-danger/10 text-danger" },
  expired: { badge: "bg-warning text-warning-foreground", reason: "bg-warning text-warning-foreground" },
};

/** [See]: every closed invoice with its timestamps and the plain reason for how it ended (§9.9). */
function CompanyRecordSheet({
  seller,
  open,
  onOpenChange,
}: {
  seller: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { invoices } = useInvoices();
  const [failuresOnly, setFailuresOnly] = useState(false);
  const now = nowSeconds();

  const profile = companyProfiles(
    invoices.filter((inv) => sameAddress(inv.seller, seller)),
    now,
  )[0];
  const closed = invoices
    .filter((inv) => sameAddress(inv.seller, seller) && isClosed(inv, now))
    .sort((a, b) => lastActivity(b) - lastActivity(a))
    .map((inv) => ({ invoice: inv, outcome: invoiceOutcome(inv, now) }));
  const failed = closed.filter((c) => c.outcome.failed).length;
  const shown = failuresOnly ? closed.filter((c) => c.outcome.failed) : closed;

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={displayName(seller)}
      description="Every closed invoice (sold, repaid, rejected or expired), straight from on-chain records."
    >
      {profile && (
        <dl className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-2xl bg-foreground/10 ring-1 ring-foreground/10">
          {[
            ["Invoices financed", String(profile.financed)],
            ["Repaid on time", percent(profile.repaidOnTimeRate)],
            ["Confirmed by buyers", percent(profile.confirmedRate)],
            ["Failed or at risk", String(failed)],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 bg-card px-3.5 py-3">
              <dt className="text-xs text-ink-muted">{label}</dt>
              <dd className={cn("text-lg font-bold tabular-nums", label.startsWith("Failed") && failed > 0 ? "text-danger" : "text-ink")}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-ink">
          {failuresOnly ? `Failed · ${shown.length} of ${closed.length}` : `Closed invoices · ${closed.length}`}
        </h3>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={failuresOnly}
          onClick={() => setFailuresOnly((on) => !on)}
          className={cn("h-9 bg-card", failuresOnly && "border-danger/40 bg-danger/10 text-danger hover:bg-danger/15")}
        >
          Failures only
        </Button>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg bg-muted/60 px-3.5 py-3 text-sm text-ink-muted">
          {failuresOnly ? "No failed or overdue invoices." : "No closed invoices yet."}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {shown.map(({ invoice, outcome }) => (
            <ClosedInvoice key={invoice.id.toString()} invoice={invoice} outcome={outcome} />
          ))}
        </ol>
      )}
    </ActionSheet>
  );
}

function ClosedInvoice({ invoice, outcome }: { invoice: Invoice; outcome: ReturnType<typeof invoiceOutcome> }) {
  const style = OUTCOME_STYLE[outcome.kind];
  const rejected = invoice.status === "Rejected";
  const timeline: [string, number][] = [
    ["Created", invoice.createdAt],
    [rejected ? "Rejected" : "Confirmed", invoice.respondedAt],
    ["Listed", invoice.listedAt],
    ["Financed", invoice.financedAt],
    ["Due", invoice.dueDate],
    ["Paid", invoice.paidAt],
  ];

  return (
    <li className="flex flex-col gap-3 rounded-2xl px-4 py-4 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-ink">Invoice #{invoice.id.toString()}</span>
          <span className="text-xs text-ink-muted">to {displayName(invoice.buyer)}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <RupiahAmount value={invoice.faceAmount} className="font-bold" />
          <Badge variant="outline" className={style.badge}>
            {outcome.label}
          </Badge>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-xs">
        {timeline
          .filter(([, at]) => at > 0)
          .map(([label, at]) => (
            <div key={label} className="contents">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="text-ink tabular-nums">{formatDateTime(at)} WIB</dd>
            </div>
          ))}
        {invoice.status === "Financed" && (
          <div className="contents">
            <dt className="text-ink-muted">Paid</dt>
            <dd className={cn("font-medium", outcome.failed ? "text-danger" : "text-ink")}>Not yet</dd>
          </div>
        )}
        {invoice.financedAt > 0 && (
          <div className="contents">
            <dt className="text-ink-muted">Sold for</dt>
            <dd className="text-ink tabular-nums">{formatRupiah(invoice.askPrice)}</dd>
          </div>
        )}
      </dl>

      <p className={cn("rounded-lg px-3 py-2.5 text-sm text-pretty", style.reason)}>
        <span className="font-bold">{outcome.failed ? "What went wrong: " : "Status: "}</span>
        {outcome.reason}
      </p>

      <Link
        href={`/invoice/${invoice.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
      >
        Open invoice
        <ArrowRightIcon className="size-3.5" aria-hidden />
      </Link>
    </li>
  );
}
