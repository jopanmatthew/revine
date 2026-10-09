import { ChevronDownIcon, CircleHelpIcon, type LucideIcon, HandCoinsIcon, ReceiptTextIcon, ShieldCheckIcon, WalletIcon } from "lucide-react";

import { panelClass } from "@/components/page";
import type { Role } from "@/lib/invoice";
import { cn } from "@/lib/utils";

export const ROLE_GUIDES: Record<Role, { title: string; description: string; steps: { icon: LucideIcon; title: string; text: string }[] }> = {
  seller: {
    title: "Get paid sooner",
    description: "Create an invoice, get your buyer's confirmation, then offer it to financiers for early payment.",
    steps: [
      { icon: ReceiptTextIcon, title: "Create an invoice", text: "Add the buyer, amount and due date." },
      { icon: ShieldCheckIcon, title: "Get it confirmed", text: "Your buyer checks the details and confirms." },
      { icon: WalletIcon, title: "Offer it for financing", text: "Set a price. Receive funds when a financier buys it." },
    ],
  },
  buyer: {
    title: "Confirm and pay invoices",
    description: "Check invoices sent to your wallet and pay the full amount to the current holder.",
    steps: [
      { icon: ReceiptTextIcon, title: "Review the details", text: "Open an invoice sent to your wallet." },
      { icon: ShieldCheckIcon, title: "Confirm or reject", text: "Confirm only when the details are correct." },
      { icon: WalletIcon, title: "Pay by the due date", text: "The payment goes to whoever holds the invoice." },
    ],
  },
  financier: {
    title: "Finance a business",
    description: "Browse buyer-confirmed invoices and choose which businesses to finance.",
    steps: [
      { icon: ReceiptTextIcon, title: "Choose an invoice", text: "Compare prices, due dates and buyer history." },
      { icon: HandCoinsIcon, title: "Finance the seller", text: "Buy the right to collect the full invoice amount." },
      { icon: WalletIcon, title: "Track repayment", text: "Receive funds when the buyer pays. Repayment is not guaranteed." },
    ],
  },
};

export function RoleSteps({ role }: { role: Role }) {
  return (
    <ol className="grid gap-5 sm:grid-cols-3">
      {ROLE_GUIDES[role].steps.map(({ icon: Icon, title, text }, index) => (
        <li key={title} className="flex items-start gap-3 sm:flex-col">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-700/[0.08] text-brand-700">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-ink"><span className="text-brand-700">{index + 1}.</span> {title}</span>
            <p className="text-sm leading-relaxed text-ink-muted">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RoleGuide({ role }: { role: Role }) {
  return (
    <details className={cn(panelClass, "group")}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">
        <CircleHelpIcon className="size-4 shrink-0 text-brand-700" aria-hidden />
        New here? Here&apos;s how it works
        <ChevronDownIcon className="ml-auto size-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-foreground/[0.07] px-5 py-5 sm:px-6"><RoleSteps role={role} /></div>
    </details>
  );
}
