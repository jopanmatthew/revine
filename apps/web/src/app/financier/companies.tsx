"use client";

import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Clock3Icon,
  FileClockIcon,
  FileTextIcon,
  HandCoinsIcon,
  ListRestartIcon,
  ShieldCheckIcon,
  StoreIcon,
  ThumbsUpIcon,
  TimerIcon,
  UserRoundIcon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react";
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
import { sameAddress } from "@/lib/demo-names";
import { formatDateTime, formatPercent, formatRupiah, nowSeconds } from "@/lib/format";
import { useInvoices, useProfileAds } from "@/lib/hooks";
import { useDisplayNameLookup } from "@/lib/profile-names";
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
 * Companies tab: one row per seller, laid out like a P2P merchant list. Paid profile ads
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
      <ul data-motion-list className={panelClass}>
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
  const displayName = useDisplayNameLookup();
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

const OUTCOME_STYLE: Record<OutcomeKind, { badge: string; reason: string; Icon: LucideIcon }> = {
  repaid: {
    badge: "border-brand-700/20 bg-brand-700/10 text-brand-700",
    reason: "bg-brand-700/[0.07] text-brand-700",
    Icon: CheckCircle2Icon,
  },
  "repaid-late": {
    badge: "bg-warning text-warning-foreground",
    reason: "bg-warning/70 text-warning-foreground",
    Icon: Clock3Icon,
  },
  financed: {
    badge: "border-sky-700/20 bg-sky-50 text-sky-800",
    reason: "bg-sky-50 text-sky-900",
    Icon: HandCoinsIcon,
  },
  defaulted: { badge: "bg-danger/10 text-danger", reason: "bg-danger/10 text-danger", Icon: CircleAlertIcon },
  rejected: { badge: "bg-danger/10 text-danger", reason: "bg-danger/10 text-danger", Icon: XCircleIcon },
  expired: {
    badge: "bg-warning text-warning-foreground",
    reason: "bg-warning/70 text-warning-foreground",
    Icon: TimerIcon,
  },
};

/** [See]: every closed invoice with its timestamps and the plain reason for how it ended. */
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
  const displayName = useDisplayNameLookup();
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
      description={
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheckIcon className="size-4 text-brand-700" aria-hidden />
          On-chain history · times in WIB
        </span>
      }
    >
      {profile && (
        <dl data-motion-list className="grid shrink-0 grid-cols-2 gap-2">
          {[
            { label: "Financed", value: String(profile.financed), Icon: HandCoinsIcon, tone: "bg-mint/15 text-brand-700" },
            { label: "On time", value: percent(profile.repaidOnTimeRate), Icon: CheckCircle2Icon, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Buyer confirmed", value: percent(profile.confirmedRate), Icon: BadgeCheckIcon, tone: "bg-sky-50 text-sky-700" },
            {
              label: "Issues",
              value: String(failed),
              Icon: failed > 0 ? AlertTriangleIcon : CheckCircle2Icon,
              tone: failed > 0 ? "bg-danger/10 text-danger" : "bg-emerald-50 text-emerald-700",
            },
          ].map(({ label, value, Icon, tone }) => (
            <div key={label} className="flex min-h-[4.5rem] items-center gap-2.5 rounded-2xl bg-muted/45 px-3 py-2.5 ring-1 ring-foreground/[0.04]">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", tone)}>
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="truncate text-xs text-ink-muted">{label}</dt>
                <dd className="text-lg font-bold leading-tight text-ink tabular-nums">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-ink">Invoice history</h3>
          <Badge variant="secondary" className="tabular-nums">{closed.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={failuresOnly}
          onClick={() => setFailuresOnly((on) => !on)}
          className={cn("h-9 gap-1.5 bg-card", failuresOnly && "border-brand-700/25 bg-brand-700/[0.07] text-brand-700 hover:bg-brand-700/10")}
        >
          {failuresOnly ? <ListRestartIcon data-icon="inline-start" /> : <AlertTriangleIcon data-icon="inline-start" />}
          {failuresOnly ? "Show all" : "Issues only"}
        </Button>
      </div>

      {shown.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {failuresOnly ? <CheckCircle2Icon className="size-5 shrink-0" aria-hidden /> : <FileClockIcon className="size-5 shrink-0" aria-hidden />}
          <p>{failuresOnly ? "All clear — no failed or overdue invoices." : "No closed invoices yet."}</p>
        </div>
      ) : (
        <ol data-motion-list className="flex flex-col gap-3">
          {shown.map(({ invoice, outcome }) => (
            <ClosedInvoice key={invoice.id.toString()} invoice={invoice} outcome={outcome} />
          ))}
        </ol>
      )}
    </ActionSheet>
  );
}

function ClosedInvoice({
  invoice,
  outcome,
}: {
  invoice: Invoice;
  outcome: ReturnType<typeof invoiceOutcome>;
}) {
  const displayName = useDisplayNameLookup();
  const style = OUTCOME_STYLE[outcome.kind];
  const timeline: { label: string; at: number; Icon: LucideIcon }[] = [
    { label: "Created", at: invoice.createdAt, Icon: FileTextIcon },
    { label: invoice.status === "Rejected" ? "Rejected" : "Confirmed", at: invoice.respondedAt, Icon: invoice.status === "Rejected" ? XCircleIcon : BadgeCheckIcon },
    { label: "Listed", at: invoice.listedAt, Icon: StoreIcon },
    { label: "Financed", at: invoice.financedAt, Icon: HandCoinsIcon },
    { label: "Due", at: invoice.dueDate, Icon: CalendarDaysIcon },
    { label: "Paid", at: invoice.paidAt, Icon: CheckCircle2Icon },
  ];
  const summary: Record<OutcomeKind, string> = {
    repaid: "Paid in full by the due date.",
    "repaid-late": outcome.reason.replace("Repaid in full, ", "Paid "),
    financed: "Buyer pays the full amount to the financier by the due date.",
    defaulted: "No payment recorded. The financier holds the risk.",
    rejected: "Buyer did not confirm. No reason was recorded.",
    expired: "No financier bought this invoice before the due date.",
  };

  return (
    <li
      className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/[0.08] transition-[box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-20px_rgb(11_31_26/0.32)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-700/10 text-brand-700">
            <FileTextIcon className="size-4.5" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-bold text-ink">Invoice #{invoice.id.toString()}</span>
            <span className="flex min-w-0 items-center gap-1 text-xs text-ink-muted">
              <UserRoundIcon className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{displayName(invoice.buyer)}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <RupiahAmount value={invoice.faceAmount} className="font-bold" />
          {invoice.financedAt > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
              <BanknoteIcon className="size-3.5" aria-hidden />
              Sold for {formatRupiah(invoice.askPrice)}
            </span>
          )}
          <Badge variant="outline" className={style.badge}>
            <style.Icon data-icon="inline-start" />
            {outcome.label}
          </Badge>
        </div>
      </div>

      <div className="rounded-xl bg-muted/45 px-3 py-3">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
          <ActivityIcon className="size-3.5 text-brand-700" aria-hidden />
          Timeline
        </h4>
        <ol aria-label={`Timeline for invoice ${invoice.id}`} data-motion-list className="flex flex-col gap-1.5">
        {timeline
          .filter(({ at }) => at > 0)
          .map(({ label, at, Icon }) => (
            <li key={label} className="grid grid-cols-[1rem_4.25rem_minmax(0,1fr)] items-center gap-2 text-xs">
              <Icon className={cn("size-3.5", label === "Paid" ? "text-brand-700" : "text-ink-muted")} aria-hidden />
              <span className="text-ink-muted">{label}</span>
              <time
                dateTime={new Date(at * 1000).toISOString()}
                aria-label={`${formatDateTime(at)} WIB`}
                className="truncate text-right font-medium text-ink tabular-nums"
              >
                {formatDateTime(at).replace(/ \d{4}, /, " · ")}
              </time>
            </li>
          ))}
        </ol>
      </div>

      <p className={cn("flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm text-pretty", style.reason)}>
        <style.Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{summary[outcome.kind]}</span>
      </p>

      <Link
        href={`/invoice/${invoice.id}`}
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-700/[0.07] px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-700/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        Open invoice
        <ArrowRightIcon className="size-3.5" aria-hidden />
      </Link>
    </li>
  );
}
