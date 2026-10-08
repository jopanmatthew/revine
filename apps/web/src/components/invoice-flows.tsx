"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { BuySheet } from "@/components/sheets/buy-sheet";
import { GetFinancedSheet } from "@/components/sheets/get-financed-sheet";
import { PaySheet } from "@/components/sheets/pay-sheet";
import { ReviewSheet } from "@/components/sheets/review-sheet";
import { txSteps, useTxRunner } from "@/components/tx-stepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/format";
import { useInvoices, useRevineActions, useWallet } from "@/lib/hooks";
import { MESSAGES } from "@/lib/messages";
import type { Invoice } from "@/lib/types";

type SheetKind = "review" | "pay" | "buy" | "finance";

/**
 * Every invoice action in one place: the sheet that prepares it, the transaction stepper that runs it,
 * and the copy for each step (PRD §9.6, §9.8, §9.9). Dashboards and the invoice page share it, so the
 * same action reads the same everywhere.
 */
export function useInvoiceFlows(
  options: {
    onConfirmed?: () => void;
    onBought?: () => void; // e.g. show the portfolio
    onBuyLost?: () => void; // someone else financed it first
  } = {},
) {
  const { isWrongNetwork } = useWallet();
  const { invoices } = useInvoices();
  const actions = useRevineActions();
  const { start, stepper, flow } = useTxRunner();
  const [sheet, setSheet] = useState<{ kind: SheetKind; id: bigint } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [unlistId, setUnlistId] = useState<bigint | null>(null);
  const current = sheet ? invoices.find((inv) => inv.id === sheet.id) : undefined;

  function open(kind: SheetKind, invoice: Invoice) {
    setSheet({ kind, id: invoice.id });
    setSheetOpen(true);
  }

  function viewInvoice(invoice: Invoice): ReactNode {
    return (
      <Button asChild size="lg" variant="secondary" className="h-11">
        <Link href={`/invoice/${invoice.id}`} onClick={flow.close}>
          View invoice
        </Link>
      </Button>
    );
  }

  function confirm(invoice: Invoice) {
    setSheetOpen(false);
    void start(
      {
        title: `Confirm invoice #${invoice.id}`,
        steps: txSteps(["wallet", "pending", "success"], { success: `Invoice #${invoice.id} confirmed ✓` }),
      },
      (onStep) => actions.confirmInvoice(invoice.id, onStep),
    ).then((result) => result.ok && options.onConfirmed?.());
  }

  function reject(invoice: Invoice) {
    setSheetOpen(false);
    void start(
      {
        title: `Reject invoice #${invoice.id}`,
        steps: txSteps(["wallet", "pending", "success"], { success: `Invoice #${invoice.id} rejected` }),
      },
      (onStep) => actions.rejectInvoice(invoice.id, onStep),
    );
  }

  function pay(invoice: Invoice) {
    setSheetOpen(false);
    void start(
      {
        title: `Pay invoice #${invoice.id}`,
        steps: txSteps(["approving", "wallet", "pending", "success"], {
          approving: `Allow revine. to use ${formatRupiah(invoice.faceAmount)}`,
          wallet: "Confirm payment in your wallet",
          success: `Paid ✓ Invoice #${invoice.id} is settled.`,
        }),
        successAction: viewInvoice(invoice),
      },
      (onStep) => actions.repayInvoice(invoice.id, onStep),
    );
  }

  function buy(invoice: Invoice) {
    setSheetOpen(false);
    void start(
      {
        title: `Finance invoice #${invoice.id}`,
        steps: txSteps(["approving", "wallet", "pending", "success"], {
          approving: `Allow revine. to use ${formatRupiah(invoice.askPrice)}`,
          success: `You now hold invoice #${invoice.id} ✓`,
        }),
        successAction: options.onBought ? (
          <Button
            size="lg"
            variant="secondary"
            className="h-11"
            onClick={() => {
              flow.close();
              options.onBought?.();
            }}
          >
            See it in your portfolio
          </Button>
        ) : (
          viewInvoice(invoice)
        ),
        failureAction: (message) => {
          if (message !== MESSAGES.buyWrongStatus) return null;
          return options.onBuyLost ? (
            <Button
              size="lg"
              className="h-11"
              onClick={() => {
                flow.close();
                options.onBuyLost?.();
              }}
            >
              Back to marketplace
            </Button>
          ) : (
            <Button asChild size="lg" className="h-11">
              <Link href="/financier" onClick={flow.close}>
                Back to marketplace
              </Link>
            </Button>
          );
        },
      },
      (onStep) => actions.buyInvoice(invoice.id, onStep),
    );
  }

  function list(invoice: Invoice, askPrice: bigint) {
    setSheetOpen(false);
    void start(
      {
        title: `List invoice #${invoice.id}`,
        steps: txSteps(["wallet", "pending", "success"], {
          success: `Listed! Financiers can now see invoice #${invoice.id}.`,
        }),
      },
      (onStep) => actions.listInvoice(invoice.id, askPrice, onStep),
    );
  }

  function unlist(id: bigint) {
    setUnlistId(null);
    void start(
      {
        title: `Unlist invoice #${id}`,
        steps: txSteps(["wallet", "pending", "success"], { success: `Invoice #${id} is no longer listed.` }),
      },
      (onStep) => actions.unlistInvoice(id, onStep),
    );
  }

  const shared = { open: sheetOpen, onOpenChange: setSheetOpen, disabled: isWrongNetwork };
  const ui = (
    <>
      {current && sheet?.kind === "review" && (
        <ReviewSheet
          key={`review-${current.id}`}
          invoice={current}
          {...shared}
          onConfirm={() => confirm(current)}
          onReject={() => reject(current)}
        />
      )}
      {current && sheet?.kind === "pay" && (
        <PaySheet key={`pay-${current.id}`} invoice={current} {...shared} onPay={() => pay(current)} />
      )}
      {current && sheet?.kind === "buy" && (
        <BuySheet key={`buy-${current.id}`} invoice={current} {...shared} onBuy={() => buy(current)} />
      )}
      {current && sheet?.kind === "finance" && (
        <GetFinancedSheet
          key={`finance-${current.id}`}
          invoice={current}
          {...shared}
          onList={(price) => list(current, price)}
        />
      )}

      <Dialog open={unlistId !== null} onOpenChange={(next) => !next && setUnlistId(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Unlist invoice #{unlistId?.toString()}?</DialogTitle>
            <DialogDescription>Financiers won&apos;t see it until you list it again.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="h-11 sm:h-9">
                Keep listed
              </Button>
            </DialogClose>
            <Button className="h-11 sm:h-9" onClick={() => unlistId !== null && unlist(unlistId)}>
              Unlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {stepper}
    </>
  );

  return {
    review: (invoice: Invoice) => open("review", invoice),
    pay: (invoice: Invoice) => open("pay", invoice),
    buy: (invoice: Invoice) => open("buy", invoice),
    getFinanced: (invoice: Invoice) => open("finance", invoice),
    unlist: (invoice: Invoice) => setUnlistId(invoice.id),
    disabled: isWrongNetwork,
    ui,
  };
}
