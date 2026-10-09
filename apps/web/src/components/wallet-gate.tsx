"use client";

import { WalletIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PageContainer, panelClass } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletButton } from "@/components/wallet-button";
import { ROLE_GUIDES, RoleSteps } from "@/components/role-guide";
import type { Role } from "@/lib/invoice";
import { useWallet } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Explain the chosen role while the visitor connects their wallet. */
export function WalletGate({ children, role }: { children: ReactNode; role?: Role }) {
  const { isConnected, isConnecting } = useWallet();

  if (isConnecting) {
    return (
      <>
        <div className="h-24 bg-brand-900 sm:h-32" />
        <PageContainer overlap className="items-center">
          <span role="status" className="sr-only">Restoring your wallet connection…</span>
          <Skeleton className="h-96 w-full max-w-2xl rounded-3xl" />
        </PageContainer>
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <div className="h-24 bg-brand-900 sm:h-32" />
        <PageContainer overlap className="items-center">
          <div className={cn(panelClass, "flex w-full max-w-2xl flex-col items-center gap-5 px-6 py-8 text-center sm:px-8 sm:py-10")}>
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-900 text-mint">
              <WalletIcon className="size-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{role ? ROLE_GUIDES[role].title : "Connect your wallet"}</h1>
              <p className="max-w-lg text-base text-pretty text-ink-muted">{role ? ROLE_GUIDES[role].description : "Your wallet is your account. Connect to see your invoices and take the next step."}</p>
            </div>
            <WalletButton />
            <p className="text-xs text-ink-muted">Connecting your wallet does not send a transaction.</p>
            {role && <div className="mt-2 w-full border-t border-foreground/[0.07] pt-6 text-left"><RoleSteps role={role} /></div>}
          </div>
        </PageContainer>
      </>
    );
  }

  return children;
}
