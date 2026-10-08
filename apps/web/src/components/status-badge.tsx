import { Badge } from "@/components/ui/badge";
import { isListingExpired, isOverdue, statusLabel, type Role } from "@/lib/invoice";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Badge styles from PRD §10.1. Status is always text plus color, never color alone.
const STATUS_STYLES: Record<InvoiceStatus, string> = {
  Created: "border-ink-muted bg-transparent text-ink-muted",
  Verified: "border-brand-700 bg-transparent text-brand-700",
  Rejected: "bg-danger text-white",
  Listed: "bg-mint text-brand-900",
  Financed: "bg-brand-700 text-white",
  Paid: "bg-brand-900 text-white",
};

// The same badges on the brand-900 cover band: outlines lighten, fills keep their colour plus a ring.
const STATUS_STYLES_DARK: Record<InvoiceStatus, string> = {
  Created: "border-white/40 bg-transparent text-white/80",
  Verified: "border-mint/60 bg-transparent text-mint",
  Rejected: "bg-danger text-white",
  Listed: "bg-mint text-brand-900",
  Financed: "bg-brand-700 text-white ring-1 ring-white/25",
  Paid: "bg-white text-brand-900",
};

const WARNING_STYLE = "bg-warning text-warning-foreground";

export function StatusBadge({
  status,
  role = "seller",
  tone = "light",
  className,
}: {
  status: InvoiceStatus;
  role?: Role;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Badge data-status={status} className={cn((tone === "dark" ? STATUS_STYLES_DARK : STATUS_STYLES)[status], className)}>
      {statusLabel(status, role)}
    </Badge>
  );
}

/** Extra tags computed in the frontend (§8.3): "Overdue" and "Listing expired". */
export function StatusTag({ tag, className }: { tag: "overdue" | "listing-expired"; className?: string }) {
  return (
    <Badge data-tag={tag} className={cn(WARNING_STYLE, className)}>
      {tag === "overdue" ? "Overdue" : "Listing expired"}
    </Badge>
  );
}

/** Status badge plus any derived tags for an invoice. */
export function InvoiceStatusBadges({
  invoice,
  role = "seller",
  tone = "light",
  now,
  className,
}: {
  invoice: Pick<Invoice, "status" | "dueDate">;
  role?: Role;
  tone?: "light" | "dark";
  now?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <StatusBadge status={invoice.status} role={role} tone={tone} />
      {isOverdue(invoice, now) && <StatusTag tag="overdue" />}
      {isListingExpired(invoice, now) && <StatusTag tag="listing-expired" />}
    </span>
  );
}
