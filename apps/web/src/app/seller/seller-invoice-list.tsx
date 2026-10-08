"use client";

import { FileTextIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { AddressName } from "@/components/address-name";
import { CreditBadgeChip } from "@/components/credit-badge-chip";
import { EmptyState } from "@/components/empty-state";
import { RupiahAmount } from "@/components/rupiah-amount";
import { InvoiceStatusBadges } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletGate } from "@/components/wallet-gate";
import { demoName, sameAddress } from "@/lib/demo-names";
import { formatDue, shortAddress } from "@/lib/format";
import { useInvoices, useWallet } from "@/lib/hooks";
import { isOverdue } from "@/lib/invoice";
import { cn } from "@/lib/utils";

// Placeholder for the seller dashboard (PRD §9.4): lists my invoices with their status badges so
// the shared components can be checked against mock data.
export function SellerInvoiceList() {
  return (
    <WalletGate>
      <SellerInvoices />
    </WalletGate>
  );
}

function SellerInvoices() {
  const { address } = useWallet();
  const { invoices, isLoading, error } = useInvoices();

  const mine = useMemo(
    () => invoices.filter((inv) => sameAddress(inv.seller, address)).sort((a, b) => Number(b.id - a.id)),
    [invoices, address],
  );

  const newInvoice = (
    <Button asChild size="lg" className="h-11 px-5">
      <Link href="/seller/new">
        <PlusIcon data-icon="inline-start" />
        New invoice
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-bold">Hi, {demoName(address) ?? shortAddress(address ?? "")}</p>
          <CreditBadgeChip address={address} />
        </div>
        {newInvoice}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error.message}
        </p>
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon />}
          title="No invoices yet. Create your first one — it takes about a minute."
          action={newInvoice}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {mine.map((inv) => (
            <li key={inv.id.toString()}>
              <Card size="sm">
                <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex min-w-40 flex-1 flex-col">
                    <AddressName address={inv.buyer} className="font-medium" />
                    <span className="text-xs text-ink-muted">#{inv.id.toString()}</span>
                  </div>
                  <div className="flex min-w-32 flex-col sm:items-end">
                    <RupiahAmount value={inv.faceAmount} className="font-bold" />
                    <span
                      className={cn("text-xs", isOverdue(inv) ? "font-medium text-warning-foreground" : "text-ink-muted")}
                    >
                      {inv.status === "Paid" || inv.status === "Rejected" ? "—" : formatDue(inv.dueDate)}
                    </span>
                  </div>
                  <InvoiceStatusBadges invoice={inv} role="seller" className="min-w-40" />
                  <Button asChild variant="outline" className="h-11 sm:h-9">
                    <Link href={`/invoice/${inv.id}`}>View</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
