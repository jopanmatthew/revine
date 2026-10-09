"use client";

import { ArrowRightIcon, HandCoinsIcon, ReceiptTextIcon, StoreIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Cover } from "@/components/cover";
import { PageContainer, panelClass } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/lib/hooks";
import type { Role } from "@/lib/invoice";
import { rememberRole, useLastRole } from "@/lib/role";
import { cn } from "@/lib/utils";

// Three large cards explain what each view is for, alongside invoice #12 from the landing page.
const ROLES: {
  role: Role;
  title: string;
  description: string;
  icon: ReactNode;
  chip: string;
  figure: string;
  figureNote: string;
}[] = [
  {
    role: "seller",
    title: "Get paid sooner",
    description: "Offer an unpaid invoice for early payment",
    icon: <StoreIcon />,
    chip: "bg-brand-700 text-white",
    figure: "+Rp9.700.000",
    figureNote: "today, for an invoice due in 30 days",
  },
  {
    role: "buyer",
    title: "Confirm & pay",
    description: "Review invoices sent to your business",
    icon: <ReceiptTextIcon />,
    chip: "bg-ink text-white",
    figure: "Rp10.000.000",
    figureNote: "paid on the due date, to whoever holds it",
  },
  {
    role: "financier",
    title: "Finance a business",
    description: "Buy confirmed invoices and track repayments",
    icon: <HandCoinsIcon />,
    chip: "bg-mint text-brand-900",
    figure: "+3,09%",
    figureNote: "in 30 days, if the buyer repays on time",
  },
];

export function RolePicker() {
  return <Picker />;
}

function Picker() {
  const lastRole = useLastRole();
  const router = useRouter();
  const { isConnected } = useWallet();

  // A returning visitor goes straight back to the view they used last.
  useEffect(() => {
    if (lastRole && isConnected) router.replace(`/${lastRole}`);
  }, [lastRole, isConnected, router]);

  if (lastRole === undefined || (lastRole && isConnected)) {
    return (
      <>
        <div className="h-56 bg-brand-900 sm:h-72" />
        <PageContainer overlap>
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Cover
        title={
          <>
            Pick how you&apos;ll use <strong>revine.</strong>
          </>
        }
        lede="Choose what you want to do, then connect your wallet. You can switch between all three roles at any time."
      />
      <PageContainer overlap>
        <ul className="grid gap-4 md:grid-cols-3 md:gap-5">
          {ROLES.map(({ role, title, description, icon, chip, figure, figureNote }) => (
            <li key={role}>
              <Link
                href={`/${role}`}
                onClick={() => rememberRole(role)}
                className={cn(
                  panelClass,
                  "group flex h-full flex-col outline-none transition-[box-shadow,transform] duration-200 ease-(--ease-out) hover:-translate-y-0.5 hover:shadow-[0_36px_70px_-36px_rgb(11_31_26/0.45)] focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:hover:translate-y-0",
                )}
              >
                <div className="flex flex-col gap-5 px-6 pt-6 pb-6 sm:px-7 sm:pt-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-12 items-center justify-center rounded-full bg-brand-900 text-mint [&_svg]:size-5">
                      {icon}
                    </span>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold capitalize", chip)}>{role}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold tracking-tight text-ink">{title}</span>
                    <span className="text-base text-ink-muted">{description}</span>
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-0.5 border-t border-foreground/[0.07] bg-muted/40 px-6 py-5 sm:px-7">
                  <span className="mb-1 text-xs font-medium text-ink-muted">Example</span>
                  <span className="text-3xl font-bold tracking-tight text-brand-700 tabular-nums">{figure}</span>
                  <span className="text-xs text-ink-muted">{figureNote}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-foreground/[0.07] px-6 py-4 text-sm font-medium text-brand-700 sm:px-7">
                  Continue as {role}
                  <ArrowRightIcon
                    className="size-4 transition-transform duration-200 ease-(--ease-out) group-hover:translate-x-1"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </PageContainer>
    </>
  );
}
