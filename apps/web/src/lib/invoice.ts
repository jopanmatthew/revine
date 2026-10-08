// Derived invoice facts computed in the frontend, not stored on-chain (PRD §8.3).
import { nowSeconds } from "@/lib/format";
import type { Invoice, InvoiceStatus } from "@/lib/types";

export type Role = "seller" | "buyer" | "financier";

const OPEN_STATUSES: InvoiceStatus[] = ["Verified", "Listed", "Financed"];

/** Now is past the due date and the status is Verified, Listed or Financed. */
export function isOverdue(invoice: Pick<Invoice, "status" | "dueDate">, now = nowSeconds()): boolean {
  return OPEN_STATUSES.includes(invoice.status) && now > invoice.dueDate;
}

/** Listed and past the due date: it can't be bought; the seller can unlist it. */
export function isListingExpired(invoice: Pick<Invoice, "status" | "dueDate">, now = nowSeconds()): boolean {
  return invoice.status === "Listed" && now > invoice.dueDate;
}

/** What each role sees for a status (§8.3). Financiers fall back to the seller's wording. */
const STATUS_LABELS: Record<Role, Record<InvoiceStatus, string>> = {
  seller: {
    Created: "Waiting for buyer",
    Verified: "Ready to finance",
    Rejected: "Rejected by buyer",
    Listed: "Open for financing",
    Financed: "Financed",
    Paid: "Paid",
  },
  buyer: {
    Created: "Needs your confirmation",
    Verified: "To pay",
    Rejected: "Rejected",
    Listed: "To pay",
    Financed: "To pay",
    Paid: "Paid",
  },
  financier: {
    Created: "Waiting for buyer",
    Verified: "Ready to finance",
    Rejected: "Rejected by buyer",
    Listed: "Open for financing",
    Financed: "Financed",
    Paid: "Paid",
  },
};

export function statusLabel(status: InvoiceStatus, role: Role = "seller"): string {
  return STATUS_LABELS[role][status];
}
