"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AddressName } from "@/components/address-name";
import { RupiahAmount } from "@/components/rupiah-amount";
import { InvoiceStatusBadges } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useInvoice } from "@/lib/hooks";

/** "12" → 12n; anything that isn't a positive whole number → null. */
function parseId(raw: string): bigint | null {
  return /^[1-9]\d{0,18}$/.test(raw) ? BigInt(raw) : null;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

// Placeholder for the invoice detail page (PRD §9.10). Public: no wallet needed.
export function InvoiceSummary({ rawId }: { rawId: string }) {
  const id = parseId(rawId);
  const { invoice, isLoading } = useInvoice(id ?? 0n);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  if (!id || !invoice) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="font-medium">Invoice not found.</p>
        <Button asChild variant="outline" className="h-11">
          <Link href="/app">Back to app</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-xl font-bold">Invoice #{invoice.id.toString()}</h2>
          <InvoiceStatusBadges invoice={invoice} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Amount">
            <RupiahAmount value={invoice.faceAmount} />
          </Fact>
          <Fact label="Due date">{formatDate(invoice.dueDate)}</Fact>
          <Fact label="Seller">
            <AddressName address={invoice.seller} />
          </Fact>
          <Fact label="Buyer">
            <AddressName address={invoice.buyer} />
          </Fact>
          <Fact label="Current holder">{invoice.holder ? <AddressName address={invoice.holder} /> : "—"}</Fact>
          {invoice.askPrice > 0n && (
            <Fact label="Price">
              <RupiahAmount value={invoice.askPrice} />
            </Fact>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
