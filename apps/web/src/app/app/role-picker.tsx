"use client";

import { ArrowRightIcon, HandCoinsIcon, ReceiptTextIcon, StoreIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Cover } from "@/components/cover";
import { PageContainer, panelClass } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletGate } from "@/components/wallet-gate";
import type { Role } from "@/lib/invoice";
import { rememberRole, useLastRole } from "@/lib/role";
import { cn } from "@/lib/utils";

// §9.3's three large cards, each with what that view is for, shown on the landing's invoice #12.
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
    title: "I sell goods",
    description: "Get paid now for your invoices",
    icon: <StoreIcon />,
    chip: "bg-brand-700 text-white",
    figure: "+Rp9.700.000",
    figureNote: "today, for an invoice due in 30 days",
  },
  {
    role: "buyer",
    title: "I owe an invoice",
    description: "Confirm and pay invoices sent to you",
    icon: <ReceiptTextIcon />,
    chip: "bg-ink text-white",
    figure: "Rp10.000.000",
    figureNote: "paid on the due date, to whoever holds it",
  },
  {
    role: "financier",
    title: "I have capital",
    description: "Finance verified invoices and earn",
    icon: <HandCoinsIcon />,
    chip: "bg-mint text-brand-900",
    figure: "+3,09%",
    figureNote: "in 30 days, on a confirmed invoice",
  },
];

export function RolePicker() {
  return (
    <WalletGate>
      <Picker />
    </WalletGate>
  );
}

function Picker() {
  const lastRole = useLastRole();
  const router = useRouter();

  // A returning visitor goes straight back to the view they used last.
  useEffect(() => {
    if (lastRole) router.replace(`/${lastRole}`);
  }, [lastRole, router]);

  if (lastRole !== null) {
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
        lede="Roles are views, not accounts. Any wallet can use any of them, and you can switch at the top any time."
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
