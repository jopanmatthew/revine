"use client";

import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, CopyIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { BuyerRecordChip } from "@/components/buyer-record";
import { CreditBadgeChip } from "@/components/credit-badge-chip";
import { useInvoiceFlows } from "@/components/invoice-flows";
import { MoneyBridge } from "@/components/money-bridge";
import { Cover, coverActionClass, coverSecondaryClass, PrintedFigure } from "@/components/cover";
import { PageContainer, Panel, panelClass } from "@/components/page";
import { PrivateDetails, PrivateDetailsLocked } from "@/components/private-details";
import { RupiahAmount } from "@/components/rupiah-amount";
import { InvoiceStatusBadges } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { displayName, sameAddress } from "@/lib/demo-names";
import { formatDate, formatDateTime, formatDue, nowSeconds } from "@/lib/format";
import { useInvoice, useInvoiceDetails, useWallet } from "@/lib/hooks";
import type { Invoice } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "12" → 12n; anything that isn't a positive whole number → null. */
function parseId(raw: string): bigint | null {
  return /^[1-9]\d{0,18}$/.test(raw) ? BigInt(raw) : null;
}

/** Invoice detail (§9.10). Public: anyone can read the public half without a wallet. */
export function InvoiceDetail({ rawId }: { rawId: string }) {
  const id = parseId(rawId);
  const { invoice, isLoading } = useInvoice(id ?? 0n);

  if (isLoading) {
    return (
      <>
        <div className="h-64 bg-brand-900 sm:h-80" />
        <PageContainer overlap>
          <Skeleton className="h-64 w-full rounded-3xl" />
        </PageContainer>
      </>
    );
  }

  if (!id || !invoice) {
    return (
      <>
        <Cover
          title={
            <>
              Invoice <strong>not found.</strong>
            </>
          }
          lede="Check the link, or open it from your dashboard."
        />
        <PageContainer overlap>
          <div className={cn(panelClass, "flex flex-col items-center gap-4 px-6 py-14 text-center")}>
            <p className="text-lg font-bold text-ink">There&apos;s no invoice #{rawId} on revine.</p>
            <Button asChild className="h-12 px-6 text-base">
              <Link href="/app">Back to app</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return <InvoiceView invoice={invoice} />;
}

function InvoiceView({ invoice }: { invoice: Invoice }) {
  const { address } = useWallet();
  const flows = useInvoiceFlows();
  const now = nowSeconds();
  const isSeller = sameAddress(address, invoice.seller);
  const isBuyer = sameAddress(address, invoice.buyer);
  const isHolder = sameAddress(address, invoice.holder);
  const open = invoice.status === "Verified" || invoice.status === "Listed" || invoice.status === "Financed";
  const back = isSeller ? "/seller" : isBuyer ? "/buyer" : isHolder ? "/financier" : "/app";

  // The same one action per role as the dashboards (§9.10).
  let action: ReactNode = null;
  if (isSeller && invoice.status === "Verified") {
    action = <ActionButton onClick={() => flows.getFinanced(invoice)} disabled={flows.disabled}>Get financed</ActionButton>;
  } else if (isSeller && invoice.status === "Listed") {
    action = (
      <ActionButton variant="outline" onClick={() => flows.unlist(invoice)} disabled={flows.disabled}>
        Unlist
      </ActionButton>
    );
  } else if (isBuyer && invoice.status === "Created") {
    action = <ActionButton onClick={() => flows.review(invoice)} disabled={flows.disabled}>Review</ActionButton>;
  } else if (isBuyer && open) {
    action = <ActionButton onClick={() => flows.pay(invoice)} disabled={flows.disabled}>Pay</ActionButton>;
  } else if (address && !isSeller && !isHolder && invoice.status === "Listed" && now < invoice.dueDate) {
    action = (
      <ActionButton onClick={() => flows.buy(invoice)} disabled={flows.disabled}>
        Finance this invoice
      </ActionButton>
    );
  }

  return (
    <>
      <Cover
        title={
          <>
            Invoice <strong>#{invoice.id.toString()}</strong>
          </>
        }
        badge={<InvoiceStatusBadges invoice={invoice} now={now} tone="dark" />}
        hero={{
          label: "Amount",
          value: (
            <PrintedFigure value={invoice.faceAmount}>
              <RupiahAmount value={invoice.faceAmount} />
            </PrintedFigure>
          ),
          note: open ? `Due ${formatDate(invoice.dueDate)} · ${formatDue(invoice.dueDate, now)}` : `Due ${formatDate(invoice.dueDate)}`,
        }}
        figures={[
          { label: "Seller", value: displayName(invoice.seller) },
          {
            label: "Buyer",
            value: (
              <span className="flex flex-wrap items-center gap-2">
                {displayName(invoice.buyer)}
                <BuyerRecordChip buyer={invoice.buyer} tone="dark" />
              </span>
            ),
          },
          { label: "Current holder", value: invoice.holder ? displayName(invoice.holder) : "—" },
        ]}
        action={action}
      >
        <Link
          href={back}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {back === "/app" ? "Back to app" : "Dashboard"}
        </Link>
      </Cover>

      <PageContainer overlap>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-6">
            {(invoice.status === "Listed" || invoice.status === "Financed" || (invoice.status === "Paid" && invoice.financedAt > 0)) && (
              <Panel className="px-5 py-5 sm:px-6 sm:py-6">
                <MoneyBridge
                  pay={invoice.askPrice}
                  receive={invoice.faceAmount}
                  dueDate={invoice.dueDate}
                  payLabel="Price"
                  receiveLabel="Amount"
                  payNote={invoice.financedAt > 0 ? "paid by the financier" : "asking price"}
                  now={now}
                />
              </Panel>
            )}

            <PrivatePanel invoice={invoice} canSee={isSeller || isBuyer} />

            <OnChainDetails invoice={invoice} />
          </div>

          <Timeline invoice={invoice} />
        </div>
      </PageContainer>

      {flows.ui}
    </>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
  variant?: "default" | "outline";
}) {
  return (
    <Button
      size="lg"
      variant={variant}
      className={variant === "outline" ? coverSecondaryClass : coverActionClass}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function PrivatePanel({ invoice, canSee }: { invoice: Invoice; canSee: boolean }) {
  const result = useInvoiceDetails(invoice.commitment);
  const started = result.isLoading || !!result.details || !!result.error;

  return (
    <Panel className="flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-ink">
        <LockIcon className="size-4" aria-hidden />
        Private details
      </h2>
      {!canSee ? (
        <PrivateDetailsLocked />
      ) : started ? (
        <PrivateDetails result={result} />
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-ink-muted">Line items and description. Only you and the other party can see them.</p>
          <Button variant="outline" className="h-11 bg-card px-5 sm:h-10" onClick={() => void result.load()}>
            Show private details
          </Button>
        </div>
      )}
    </Panel>
  );
}

function OnChainDetails({ invoice }: { invoice: Invoice }) {
  const [copied, setCopied] = useState(false);
  const fingerprint = `${invoice.commitment.slice(0, 10)}…${invoice.commitment.slice(-6)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(invoice.commitment);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard blocked; the shortened fingerprint stays visible.
    }
  }

  return (
    <details className={cn(panelClass, "group")}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-lg font-bold tracking-tight text-ink select-none sm:px-6 [&::-webkit-details-marker]:hidden">
        On-chain details
        <ChevronDownIcon className="size-5 text-ink-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <dl className="divide-y divide-foreground/[0.07] border-t border-foreground/[0.07]">
        <Fact label="Invoice token ID">
          {invoice.holder ? `#${invoice.id}` : <span className="text-ink-muted">Minted when the buyer confirms</span>}
        </Fact>
        <Fact label="Fingerprint">
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-xs">{fingerprint}</span>
            <Button variant="ghost" size="icon-xs" onClick={copy} aria-label={copied ? "Fingerprint copied" : "Copy fingerprint"}>
              {copied ? <CheckIcon className="text-brand-700" /> : <CopyIcon />}
            </Button>
          </span>
        </Fact>
        <Fact label="Invoice proof">Fingerprint only</Fact>
        <Fact label="Seller credit badge">
          <CreditBadgeChip address={invoice.seller} />
        </Fact>
      </dl>
    </details>
  );
}

type StepState = "done" | "failed" | "next" | "skipped";

function Timeline({ invoice }: { invoice: Invoice }) {
  const rejected = invoice.status === "Rejected";
  const paid = invoice.status === "Paid";
  const steps: { label: string; at: number; state: StepState }[] = [
    { label: "Created", at: invoice.createdAt, state: "done" },
    {
      label: rejected ? "Rejected" : "Confirmed",
      at: invoice.respondedAt,
      state: rejected ? "failed" : invoice.respondedAt > 0 ? "done" : "next",
    },
  ];
  if (!rejected) {
    const after = (at: number) => (at > 0 ? "done" : paid ? "skipped" : "next");
    steps.push(
      { label: "Listed", at: invoice.listedAt, state: after(invoice.listedAt) },
      { label: "Financed", at: invoice.financedAt, state: after(invoice.financedAt) },
      { label: "Paid", at: invoice.paidAt, state: invoice.paidAt > 0 ? "done" : "next" },
    );
  }

  return (
    <Panel className="px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="mb-5 text-lg font-bold tracking-tight text-ink">Timeline</h2>
      <ol className="flex flex-col">
        {steps.map((step, i) => (
          <li key={step.label} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 size-3 shrink-0 rounded-full",
                  step.state === "done" && "bg-brand-700",
                  step.state === "failed" && "bg-danger",
                  (step.state === "next" || step.state === "skipped") && "border-2 border-foreground/15 bg-card",
                )}
              />
              {i < steps.length - 1 && (
                <span aria-hidden className={cn("w-px flex-1", step.state === "done" ? "bg-brand-700/40" : "bg-foreground/10")} />
              )}
            </div>
            <div className={cn("flex flex-col pb-5", i === steps.length - 1 && "pb-0")}>
              <span
                className={cn(
                  "text-sm font-medium",
                  step.state === "done" ? "text-ink" : step.state === "failed" ? "text-danger" : "text-ink-muted",
                )}
              >
                {step.label}
              </span>
              <span className="text-xs text-ink-muted tabular-nums">
                {step.at > 0 ? formatDateTime(step.at) : step.state === "skipped" ? "Skipped" : "—"}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
