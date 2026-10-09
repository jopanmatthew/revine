"use client";

import { useMemo, useState } from "react";

import { Cover, CoverTabs, PrintedFigure } from "@/components/cover";
import { DueText } from "@/components/due-text";
import { useInvoiceFlows } from "@/components/invoice-flows";
import { LedgerEmpty, LedgerLine, LedgerSheet, LedgerSkeleton } from "@/components/ledger";
import { ErrorNote, PageContainer } from "@/components/page";
import { RupiahAmount } from "@/components/rupiah-amount";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { WalletGate } from "@/components/wallet-gate";
import { RoleGuide } from "@/components/role-guide";
import { sameAddress } from "@/lib/demo-names";
import { formatDate, formatDayMonth, formatDue, formatTimeAgo, nowSeconds } from "@/lib/format";
import { useInvoices, useWallet } from "@/lib/hooks";
import { useDisplayNameLookup } from "@/lib/profile-names";
import { isFresh, isOverdue, lastActivity, plural } from "@/lib/invoice";
import { useRememberRole } from "@/lib/role";

type BuyerTab = "confirm" | "pay" | "history";

export function BuyerDashboard() {
  return (
    <WalletGate role="buyer">
      <BuyerInvoices />
    </WalletGate>
  );
}

function BuyerInvoices() {
  useRememberRole("buyer");
  const { address } = useWallet();
  const displayName = useDisplayNameLookup();
  const { invoices, isLoading, error, refetch } = useInvoices();
  const [tab, setTab] = useState<BuyerTab>("confirm");
  const flows = useInvoiceFlows({ onConfirmed: () => setTab("pay") });
  const now = nowSeconds();

  const { toConfirm, toPay, history } = useMemo(() => {
    const mine = invoices.filter((inv) => sameAddress(inv.buyer, address));
    return {
      toConfirm: mine.filter((inv) => inv.status === "Created").sort((a, b) => b.createdAt - a.createdAt),
      // Overdue first, then soonest due: both fall out of sorting by due date.
      toPay: mine
        .filter((inv) => inv.status === "Verified" || inv.status === "Listed" || inv.status === "Financed")
        .sort((a, b) => a.dueDate - b.dueDate),
      history: mine
        .filter((inv) => inv.status === "Paid" || inv.status === "Rejected")
        .sort((a, b) => lastActivity(b) - lastActivity(a)),
    };
  }, [invoices, address]);

  const owed = toPay.reduce((sum, inv) => sum + inv.faceAmount, 0n);
  const overdueCount = toPay.filter((inv) => isOverdue(inv, now)).length;
  const next = toPay[0];

  const tabs: { value: BuyerTab; label: string; count?: number }[] = [
    { value: "confirm", label: "To confirm", count: toConfirm.length },
    { value: "pay", label: "To pay", count: toPay.length },
    { value: "history", label: "History" },
  ];

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as BuyerTab)} className="gap-0">
      <Cover
        title={
          <>
            Hi, <strong>{displayName(address ?? "")}</strong>
          </>
        }
        loading={isLoading}
        hero={{
          label: "You owe",
          value: (
            <PrintedFigure value={owed}>
              <RupiahAmount value={owed} />
            </PrintedFigure>
          ),
          note:
            toPay.length > 0
              ? `${plural(toPay.length, "invoice")}${overdueCount > 0 ? `, ${overdueCount} overdue` : ""}. Pay the full amount by each due date.`
              : "Nothing to pay right now.",
        }}
        figures={[
          { label: "To confirm", value: toConfirm.length },
          {
            label: "Next due",
            value: next ? (
              <span className={next && isOverdue(next, now) ? "text-amber-300" : undefined}>
                {formatDue(next.dueDate, now)}
              </span>
            ) : (
              "—"
            ),
          },
        ]}
        tabs={<CoverTabs items={tabs.map((t) => ({ ...t, count: isLoading ? undefined : t.count }))} />}
      />

      <PageContainer overlap>
        <RoleGuide role="buyer" />
        {error ? (
          <ErrorNote onRetry={refetch}>We couldn&apos;t load your invoices. Check your connection and try again.</ErrorNote>
        ) : (
          <>
            <TabsContent value="confirm">
              {isLoading ? (
                <LedgerSkeleton />
              ) : toConfirm.length === 0 ? (
                <LedgerEmpty title="Nothing to confirm." description="Invoices sent to your wallet show up here." />
              ) : (
                <LedgerSheet>
                  {toConfirm.map((inv) => (
                    <LedgerLine
                      key={inv.id.toString()}
                      href={`/invoice/${inv.id}`}
                      label={`Open invoice #${inv.id}`}
                      fresh={isFresh(inv, now)}
                      avatar={displayName(inv.seller)}
                      date={formatDayMonth(inv.createdAt)}
                      title={displayName(inv.seller)}
                      meta={
                        <>
                          <span>#{inv.id.toString()}</span>
                          <span>sent {formatTimeAgo(inv.createdAt, now)}</span>
                          <span>due {formatDate(inv.dueDate)}</span>
                        </>
                      }
                      amount={<RupiahAmount value={inv.faceAmount} />}
                      action={
                        <Button className="h-10 px-6 sm:h-9" onClick={() => flows.review(inv)}>
                          Review
                        </Button>
                      }
                    />
                  ))}
                </LedgerSheet>
              )}
            </TabsContent>

            <TabsContent value="pay">
              {isLoading ? (
                <LedgerSkeleton />
              ) : toPay.length === 0 ? (
                <LedgerEmpty title="No invoices to pay." />
              ) : (
                <LedgerSheet>
                  {toPay.map((inv) => (
                    <LedgerLine
                      key={inv.id.toString()}
                      href={`/invoice/${inv.id}`}
                      label={`Open invoice #${inv.id}`}
                      fresh={isFresh(inv, now)}
                      avatar={displayName(inv.seller)}
                      date={formatDayMonth(inv.dueDate)}
                      title={displayName(inv.seller)}
                      meta={
                        <>
                          <span>#{inv.id.toString()}</span>
                          <span>
                            Pay to <span className="font-medium text-ink">{displayName(inv.holder ?? inv.seller)}</span>
                          </span>
                          <DueText dueDate={inv.dueDate} now={now} showDate={false} />
                        </>
                      }
                      amount={<RupiahAmount value={inv.faceAmount} />}
                      action={
                        <Button className="h-10 px-6 sm:h-9" disabled={flows.disabled} onClick={() => flows.pay(inv)}>
                          Pay
                        </Button>
                      }
                    />
                  ))}
                </LedgerSheet>
              )}
            </TabsContent>

            <TabsContent value="history">
              {isLoading ? (
                <LedgerSkeleton />
              ) : history.length === 0 ? (
                <LedgerEmpty title="No past invoices yet." />
              ) : (
                <LedgerSheet>
                  {history.map((inv) => (
                    <LedgerLine
                      key={inv.id.toString()}
                      href={`/invoice/${inv.id}`}
                      label={`Open invoice #${inv.id}`}
                      fresh={isFresh(inv, now)}
                      avatar={displayName(inv.seller)}
                      date={formatDayMonth(lastActivity(inv))}
                      title={displayName(inv.seller)}
                      meta={<span>#{inv.id.toString()}</span>}
                      status={<StatusBadge status={inv.status} role="buyer" />}
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
