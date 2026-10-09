"use client";

import { LockIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionSheet } from "@/components/action-sheet";
import { AddressName } from "@/components/address-name";
import { PrivateDetails } from "@/components/private-details";
import { RupiahAmount } from "@/components/rupiah-amount";
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
import { formatDate, formatRupiah } from "@/lib/format";
import { useInvoiceDetails } from "@/lib/hooks";
import type { Invoice } from "@/lib/types";

/** Review sheet (§9.8): the private details, checked against the fingerprint, then confirm or reject. */
export function ReviewSheet({
  invoice,
  open,
  onOpenChange,
  onConfirm,
  onReject,
  disabled,
}: {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onReject: () => void;
  disabled: boolean; // wrong network
}) {
  const details = useInvoiceDetails(invoice.commitment);
  const { load, details: loaded, isLoading, error } = details;
  const [rejecting, setRejecting] = useState(false);
  const id = invoice.id.toString();

  // Opening the review is the request to see the details: verify the wallet and fetch them once.
  useEffect(() => {
    if (open && !loaded && !isLoading && !error) void load();
  }, [open, loaded, isLoading, error, load]);

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Review invoice #${id}`}
      description="Check the private details before you confirm."
      footer={
        <>
          <Button size="lg" className="h-11" disabled={disabled || details.matches !== true} onClick={onConfirm}>
            Confirm invoice
          </Button>
          <Button size="lg" variant="outline" className="h-11 text-danger" disabled={disabled} onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <RupiahAmount value={invoice.faceAmount} className="text-[clamp(1.4rem,7vw,1.875rem)] font-bold tracking-tight" />
        <p className="text-sm text-ink-muted">
          from <AddressName address={invoice.seller} className="font-medium text-ink" /> · due {formatDate(invoice.dueDate)}
        </p>
      </div>

      <section className="flex flex-col gap-3" aria-label="Private details">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <LockIcon className="size-3.5" aria-hidden />
          Private details
        </h3>
        <PrivateDetails result={details} />
      </section>

      <p className="text-sm text-pretty text-ink-muted">
        By confirming, you agree you owe {formatRupiah(invoice.faceAmount)}, due {formatDate(invoice.dueDate)}, to whoever
        holds this invoice on that date.
      </p>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject invoice #{id}?</DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="h-11 sm:h-9">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="h-11 sm:h-9"
              onClick={() => {
                setRejecting(false);
                onReject();
              }}
            >
              Reject invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ActionSheet>
  );
}
