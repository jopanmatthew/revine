"use client";

import { ArrowRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CreditBadgeChip } from "@/components/credit-badge-chip";
import { Cover, coverActionClass, CoverTabs, PrintedFigure } from "@/components/cover";
import { DueText } from "@/components/due-text";
import { useInvoiceFlows } from "@/components/invoice-flows";
import { LedgerEmpty, LedgerLine, LedgerSheet, LedgerSkeleton } from "@/components/ledger";
import { ErrorNote, PageContainer } from "@/components/page";
import { showPaidToast } from "@/components/paid-toast";
import { RupiahAmount } from "@/components/rupiah-amount";
import { StatusBadge, StatusTag } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { WalletGate } from "@/components/wallet-gate";
import { displayName, sameAddress } from "@/lib/demo-names";
import { formatDate, formatDayMonth, formatRupiah, nowSeconds } from "@/lib/format";
import { useCreditBadge, useInvoices, useWallet } from "@/lib/hooks";
import { isFresh, isListingExpired, lastActivity, plural } from "@/lib/invoice";
import { useRememberRole } from "@/lib/role";
import type { Invoice, InvoiceStatus } from "@/lib/types";

type SellerTab = "all" | Exclude<InvoiceStatus, "Rejected">;

const TABS: { value: SellerTab; label: string; empty: string }[] = [
  { value: "all", label: "All", empty: "No invoices yet." },
  { value: "Created", label: "Waiting for buyer", empty: "No invoices waiting for a buyer." },
  { value: "Verified", label: "Ready to finance", empty: "No invoices ready to finance." },
  { value: "Listed", label: "Listed", empty: "No invoices listed right now." },
  { value: "Financed", label: "Financed", empty: "No financed invoices yet." },
  { value: "Paid", label: "Paid", empty: "No paid invoices yet." },
];

export function SellerDashboard() {
  return (
    <WalletGate>
      <SellerInvoices />
    </WalletGate>
  );
}

/**
 * The success moment (§9.1): when one of my invoices goes from Listed to Financed between refetches,
 * celebrate. Works across windows too, since the financier buys from their own wallet.
 */
function usePaidToast(mine: Invoice[], loaded: boolean) {
  const seen = useRef<Map<bigint, InvoiceStatus> | null>(null);

  useEffect(() => {
    if (!loaded) return;
    const previous = seen.current;
    seen.current = new Map(mine.map((inv) => [inv.id, inv.status]));
    if (!previous) return;
    for (const inv of mine) {
      if (previous.get(inv.id) === "Listed" && inv.status === "Financed") {
        showPaidToast({
          id: `paid-${inv.id}`,
          amount: inv.askPrice,
          detail: `${displayName(inv.holder ?? "")} financed invoice #${inv.id}. The cash is in your wallet.`,
        });
      }
    }
  }, [mine, loaded]);
}

function SellerInvoices() {
  useRememberRole("seller");
  const { address } = useWallet();
  const { invoices, isLoading, error } = useInvoices();
  const { badge } = useCreditBadge(address);
  const flows = useInvoiceFlows();
  const [tab, setTab] = useState<SellerTab>("all");
  const now = nowSeconds();

  const mine = useMemo(
    () => invoices.filter((inv) => sameAddress(inv.seller, address)).sort((a, b) => Number(b.id - a.id)),
    [invoices, address],
  );
  usePaidToast(mine, !isLoading);

  const waiting = mine.filter((inv) => inv.status === "Created");
  const ready = mine.filter((inv) => inv.status === "Verified");
  const readyTotal = ready.reduce((sum, inv) => sum + inv.faceAmount, 0n);
  // §9.4: prices of my financed invoices, plus amounts repaid straight to me.
  const cashReceived = mine.reduce(
    (sum, inv) => (inv.financedAt > 0 ? sum + inv.askPrice : inv.status === "Paid" ? sum + inv.faceAmount : sum),
    0n,
  );

  function action(inv: Invoice) {
    if (inv.status === "Verified") {
      return (
        <Button className="h-10 px-4 sm:h-9" disabled={flows.disabled} onClick={() => flows.getFinanced(inv)}>
          Get financed
        </Button>
      );
    }
    if (inv.status === "Listed") {
      return (
        <Button
          variant="outline"
          className="h-10 bg-card px-4 sm:h-9"
          disabled={flows.disabled}
          onClick={() => flows.unlist(inv)}
        >
          Unlist
        </Button>
      );
    }
    return null;
  }

  function meta(inv: Invoice) {
    const id = <span>#{inv.id.toString()}</span>;
    if (inv.status === "Paid") {
      return (
        <>
          {id}
          <span>Paid {formatDate(inv.paidAt)}</span>
        </>
      );
    }
    if (inv.status === "Rejected") {
      return (
        <>
          {id}
          <span>Rejected {formatDate(inv.respondedAt)}</span>
        </>
      );
    }
    if (inv.status === "Created") {
      return (
        <>
          {id}
          <span>due {formatDate(inv.dueDate)}</span>
        </>
      );
    }
    return (
      <>
        {id}
        <DueText dueDate={inv.dueDate} now={now} showDate={false} />
        {isListingExpired(inv, now) && <StatusTag tag="listing-expired" />}
      </>
    );
  }

  const newInvoice = (
    <Button asChild size="lg" className={coverActionClass}>
      <Link href="/seller/new">
        <PlusIcon data-icon="inline-start" />
        New invoice
      </Link>
    </Button>
  );

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as SellerTab)} className="gap-0">
      <Cover
        title={
          <>
            Hi, <strong>{displayName(address ?? "")}</strong>
          </>
        }
        badge={
          badge?.isValid ? (
            <CreditBadgeChip address={address} tone="dark" />
          ) : (
            badge && (
              <Link
                href="/seller/credit"
                className="inline-flex items-center gap-1 text-sm font-medium text-mint underline-offset-4 hover:underline"
              >
                Get a credit badge
                <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
            )
          )
        }
        loading={isLoading}
        hero={{
          label: "Ready to finance",
          value: (
            <PrintedFigure value={readyTotal}>
              <RupiahAmount value={readyTotal} />
            </PrintedFigure>
          ),
          note:
            ready.length > 0
              ? `${plural(ready.length, "invoice")} confirmed by the buyer. ${ready.length === 1 ? "List it" : "List one"} and get paid today.`
              : "Invoices your buyer confirms show up here, ready to sell for cash today.",
        }}
        figures={[
          { label: "Waiting for buyer", value: waiting.length },
          {
            label: "Cash received",
            value: (
              <PrintedFigure value={cashReceived}>
                <span className="text-mint">{formatRupiah(cashReceived)}</span>
              </PrintedFigure>
            ),
          },
        ]}
        action={newInvoice}
        tabs={
          !isLoading &&
          mine.length > 0 && (
            <CoverTabs
              items={TABS.map((t) => ({
                value: t.value,
                label: t.label,
                count: t.value === "all" ? mine.length : mine.filter((inv) => inv.status === t.value).length,
              }))}
            />
          )
        }
      />

      <PageContainer overlap>
        {error ? (
          <ErrorNote>{error.message}</ErrorNote>
        ) : isLoading ? (
          <LedgerSkeleton />
        ) : mine.length === 0 ? (
          <LedgerEmpty
            title="No invoices yet."
            description="Create your first one — it takes about a minute."
            action={
              <Button asChild className="h-12 px-6 text-base">
                <Link href="/seller/new">
                  <PlusIcon data-icon="inline-start" />
                  New invoice
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            {TABS.map((t) => {
              const rows = t.value === "all" ? mine : mine.filter((inv) => inv.status === t.value);
              return (
                <TabsContent key={t.value} value={t.value}>
                  {rows.length === 0 ? (
                    <LedgerEmpty title={t.empty} />
                  ) : (
                    <LedgerSheet>
                      {rows.map((inv) => (
                        <LedgerLine
                          key={inv.id.toString()}
                          href={`/invoice/${inv.id}`}
                          label={`Open invoice #${inv.id}`}
                          fresh={isFresh(inv, now)}
                          avatar={displayName(inv.buyer)}
                          date={formatDayMonth(lastActivity(inv))}
                          title={displayName(inv.buyer)}
                          meta={meta(inv)}
                          status={<StatusBadge status={inv.status} role="seller" />}
                          amount={<RupiahAmount value={inv.faceAmount} />}
                          action={action(inv)}
                        />
                      ))}
                    </LedgerSheet>
                  )}
                </TabsContent>
              );
            })}
          </>
        )}
      </PageContainer>

      {flows.ui}
    </Tabs>
  );
}
