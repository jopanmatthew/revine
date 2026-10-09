"use client";

import { CheckCircle2Icon, ChevronDownIcon, LockIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BuyerRecordChip } from "@/components/buyer-record";
import { CreditBadgeChip } from "@/components/credit-badge-chip";
import { Cover, CoverTabs, PrintedFigure } from "@/components/cover";
import { DueText } from "@/components/due-text";
import { useInvoiceFlows } from "@/components/invoice-flows";
import { Avatar, LedgerEmpty, LedgerLine, LedgerSheet, LedgerSkeleton } from "@/components/ledger";
import { ErrorNote, PageContainer, panelClass } from "@/components/page";
import { RupiahAmount } from "@/components/rupiah-amount";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { WalletGate } from "@/components/wallet-gate";
import { RoleGuide } from "@/components/role-guide";
import { sameAddress } from "@/lib/demo-names";
import {
  annualizedReturn,
  daysToDue,
  formatDate,
  formatDayMonth,
  formatPercent,
  formatRupiah,
  nowSeconds,
  profitOf,
  returnPercent,
} from "@/lib/format";
import { useCreditBadge, useInvoices, useWallet } from "@/lib/hooks";
import { useDisplayNameLookup } from "@/lib/profile-names";
import { isFresh } from "@/lib/invoice";
import { useRememberRole } from "@/lib/role";
import type { Invoice } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CompanyList } from "./companies";

/** Controls on the dark cover band, next to the tabs. */
const DARK_CONTROL =
  "h-10 rounded-full border-white/15 bg-white/[0.06] px-4 text-white hover:bg-white/[0.12] hover:text-white focus-visible:border-white/30 focus-visible:ring-mint/40 aria-expanded:bg-white/[0.12] aria-expanded:text-white";

type FinancierTab = "marketplace" | "companies" | "portfolio";
type SortOrder = "return" | "due" | "newest";

const SORTS: { value: SortOrder; label: string }[] = [
  { value: "return", label: "Highest return" },
  { value: "due", label: "Soonest due" },
  { value: "newest", label: "Newest" },
];

const SORTERS: Record<SortOrder, (a: Invoice, b: Invoice) => number> = {
  return: (a, b) => returnPercent(b.faceAmount, b.askPrice) - returnPercent(a.faceAmount, a.askPrice),
  due: (a, b) => a.dueDate - b.dueDate,
  newest: (a, b) => b.listedAt - a.listedAt,
};

export function FinancierDashboard() {
  return (
    <WalletGate role="financier">
      <FinancierInvoices />
    </WalletGate>
  );
}

function FinancierInvoices() {
  useRememberRole("financier");
  const { address } = useWallet();
  const displayName = useDisplayNameLookup();
  const { invoices, isLoading, error, refetch } = useInvoices();
  const [tab, setTab] = useState<FinancierTab>("marketplace");
  const [sort, setSort] = useState<SortOrder>("return");
  const [badgeOnly, setBadgeOnly] = useState(false);
  const flows = useInvoiceFlows({ onBought: () => setTab("portfolio"), onBuyLost: () => setTab("marketplace") });
  const now = nowSeconds();

  // Listed, not past due, not mine (§9.9). A few hundred invoices at most, so no memo needed.
  const open = invoices
    .filter((inv) => inv.status === "Listed" && now < inv.dueDate && !sameAddress(inv.seller, address))
    .sort(SORTERS[sort]);
  const mine = invoices.filter((inv) => sameAddress(inv.holder, address) && inv.financedAt > 0);
  const held = [
    ...mine.filter((inv) => inv.status === "Financed").sort((a, b) => a.dueDate - b.dueDate),
    ...mine.filter((inv) => inv.status === "Paid").sort((a, b) => b.paidAt - a.paidAt),
  ];

  // Portfolio figures (§9.9): the cover carries them on both tabs.
  const invested = held.reduce((sum, inv) => sum + inv.askPrice, 0n);
  const awaitingRepayment = held.filter((inv) => inv.status === "Financed");
  const expected = awaitingRepayment.reduce((sum, inv) => sum + inv.faceAmount, 0n);
  const paid = held.filter((inv) => inv.status === "Paid");
  const received = paid.reduce((sum, inv) => sum + inv.faceAmount, 0n);
  const profit = paid.reduce((sum, inv) => sum + inv.faceAmount - inv.askPrice, 0n);

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as FinancierTab)} className="gap-0">
      <Cover
        title={
          <>
            Hi, <strong>{displayName(address ?? "")}</strong>
          </>
        }
        loading={isLoading}
        hero={{
          label: "Expected repayments",
          value: (
            <PrintedFigure value={expected}>
              <RupiahAmount value={expected} />
            </PrintedFigure>
          ),
          note:
            awaitingRepayment.length > 0
              ? `Full amounts still due on ${awaitingRepayment.length === 1 ? "1 invoice you've financed" : `${awaitingRepayment.length} invoices you've financed`}. Received when the buyers pay.`
              : "You have no repayments pending. Browse the marketplace to finance your first invoice.",
        }}
        figures={[
          { label: "Total financed", value: formatRupiah(invested) },
          { label: "Repaid to you", value: formatRupiah(received) },
          {
            label: "Profit received",
            value: (
              <PrintedFigure value={profit}>
                <span className="text-mint">{formatRupiah(profit, { sign: true })}</span>
              </PrintedFigure>
            ),
          },
        ]}
        tabs={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CoverTabs
              items={[
                { value: "marketplace", label: "Marketplace", count: isLoading ? undefined : open.length },
                { value: "companies", label: "Companies" },
                { value: "portfolio", label: "Portfolio", count: isLoading ? undefined : held.length },
              ]}
            />
            {tab === "marketplace" && (
              <div className="flex items-center gap-2">
                <SortMenu value={sort} onChange={setSort} />
                <Button
                  variant="outline"
                  aria-pressed={badgeOnly}
                  onClick={() => setBadgeOnly((on) => !on)}
                  className={cn(
                    DARK_CONTROL,
                    badgeOnly && "border-mint bg-mint text-brand-900 hover:bg-mint/90 hover:text-brand-900",
                  )}
                >
                  <ShieldCheckIcon data-icon="inline-start" />
                  <span className="sm:hidden">Badge only</span>
                  <span className="max-sm:hidden">Credit badge only</span>
                </Button>
              </div>
            )}
          </div>
        }
      />

      <PageContainer overlap>
        <RoleGuide role="financier" />
        {error ? (
          <ErrorNote onRetry={refetch}>We couldn&apos;t load your invoices. Check your connection and try again.</ErrorNote>
        ) : (
          <>
            <TabsContent value="marketplace" className="flex flex-col gap-3">
              <p className="px-1 text-sm leading-relaxed text-ink-muted">Choose a buyer-confirmed invoice. Review the buyer&apos;s history, the price and the due date before financing.</p>
              {isLoading ? (
                <LedgerSkeleton rows={2} />
              ) : open.length === 0 ? (
                <LedgerEmpty
                  title="No invoices open for financing right now."
                  description="New ones appear here automatically."
                />
              ) : (
                <>
                  <ul className={cn(panelClass, "peer empty:hidden")}>
                    {open.map((inv) => (
                      <MarketEntry
                        key={inv.id.toString()}
                        invoice={inv}
                        badgeOnly={badgeOnly}
                        now={now}
                        disabled={flows.disabled}
                        onFinance={() => flows.buy(inv)}
                      />
                    ))}
                  </ul>
                  {/* Shown only when every entry hid itself under the badge filter. */}
                  <div className="hidden peer-empty:block">
                    <LedgerEmpty
                      title="No invoices from sellers with a credit badge right now."
                      action={
                        <Button variant="outline" className="h-11 px-5 sm:h-10" onClick={() => setBadgeOnly(false)}>
                          Show all invoices
                        </Button>
                      }
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="companies">
              <CompanyList />
            </TabsContent>

            <TabsContent value="portfolio">
              {isLoading ? (
                <LedgerSkeleton />
              ) : held.length === 0 ? (
                <LedgerEmpty
                  title="You haven't financed any invoices yet."
                  action={
                    <Button className="h-11 px-5 sm:h-10" onClick={() => setTab("marketplace")}>
                      Browse marketplace
                    </Button>
                  }
                />
              ) : (
                <LedgerSheet>
                  {held.map((inv) => (
                    <LedgerLine
                      key={inv.id.toString()}
                      href={`/invoice/${inv.id}`}
                      label={`Open invoice #${inv.id}`}
                      fresh={isFresh(inv, now)}
                      avatar={displayName(inv.buyer)}
                      date={formatDayMonth(inv.status === "Paid" ? inv.paidAt : inv.financedAt)}
                      title={displayName(inv.buyer)}
                      meta={
                        <>
                          <span>#{inv.id.toString()}</span>
                          <span>paid {formatRupiah(inv.askPrice)}</span>
                          {inv.status === "Financed" ? (
                            <DueText dueDate={inv.dueDate} now={now} showDate={false} />
                          ) : (
                            <span>repaid {formatDate(inv.paidAt)}</span>
                          )}
                        </>
                      }
                      status={<StatusBadge status={inv.status} role="financier" />}
                      amount={<RupiahAmount value={inv.faceAmount} />}
                    />
                  ))}
                </LedgerSheet>
              )}
            </TabsContent>
          </>
        )}
      </PageContainer>

      {flows.ui}
    </Tabs>
  );
}

function SortMenu({ value, onChange }: { value: SortOrder; onChange: (value: SortOrder) => void }) {
  const current = SORTS.find((s) => s.value === value)?.label;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn(DARK_CONTROL, "gap-1.5")}>
          <span className="text-white/60 max-sm:hidden">Sort:</span>
          {current}
          <ChevronDownIcon className="text-white/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as SortOrder)}>
          {SORTS.map((s) => (
            <DropdownMenuRadioItem key={s.value} value={s.value} className="h-10 sm:h-8">
              {s.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * One open invoice (§9.9), as a ledger entry: the return leads (it's what financiers sort by), the
 * money line says what you pay and get and when, and trust facts sit quietly underneath.
 */
function MarketEntry({
  invoice,
  badgeOnly,
  now,
  disabled,
  onFinance,
}: {
  invoice: Invoice;
  badgeOnly: boolean;
  now: number;
  disabled: boolean;
  onFinance: () => void;
}) {
  const { badge, isLoading } = useCreditBadge(invoice.seller);
  const displayName = useDisplayNameLookup();
  if (badgeOnly && !isLoading && !badge?.isValid) return null;

  const pct = returnPercent(invoice.faceAmount, invoice.askPrice);
  const days = daysToDue(invoice.dueDate, now);
  const yearly = annualizedReturn(pct, days);

  return (
    <li
      data-fresh={isFresh(invoice, now) || undefined}
      className="relative grid gap-4 border-b border-foreground/[0.07] px-4 py-5 transition-colors duration-150 last:border-b-0 hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:px-6"
    >
      <div className="flex min-w-0 gap-3.5">
        <Avatar name={displayName(invoice.seller)} />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="font-bold text-ink">{displayName(invoice.seller)}</span>
            <span className="relative z-10">
              <CreditBadgeChip address={invoice.seller} />
            </span>
          </div>
          <p className="text-[0.9375rem] text-ink tabular-nums">
            Pay <strong className="font-bold">{formatRupiah(invoice.askPrice)}</strong>
            <span className="mx-1.5 text-brand-700" aria-hidden>
              →
            </span>
            <span className="sr-only">, </span>
            get <strong className="font-bold">{formatRupiah(invoice.faceAmount)}</strong>{" "}
            <span className="text-ink-muted">
              in {days} {days === 1 ? "day" : "days"} · {formatDate(invoice.dueDate)}
            </span>
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2Icon className="size-3.5 text-brand-700" aria-hidden />
              {displayName(invoice.buyer)} · Buyer confirmed
            </span>
            <span className="relative z-10">
              <BuyerRecordChip buyer={invoice.buyer} />
            </span>
            <span className="inline-flex items-center gap-1">
              <LockIcon className="size-3.5" aria-hidden />
              Details private
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:items-end">
        <div className="flex flex-col sm:items-end">
          <span data-print className="text-2xl font-bold tracking-tight text-brand-700 tabular-nums">
            {formatRupiah(profitOf(invoice.faceAmount, invoice.askPrice), { sign: true })} · {formatPercent(pct)}
          </span>
          {yearly !== null && (
            <span className="text-xs text-ink-muted">≈{formatPercent(yearly, 1)} per year, if repaid on time</span>
          )}
        </div>
        <Button className="relative z-10 h-11 shrink-0 px-5 max-sm:w-full sm:h-10" disabled={disabled} onClick={onFinance}>
          Finance this invoice
        </Button>
      </div>

      <Link
        href={`/invoice/${invoice.id}`}
        aria-label={`Open invoice #${invoice.id}`}
        className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      />
    </li>
  );
}
