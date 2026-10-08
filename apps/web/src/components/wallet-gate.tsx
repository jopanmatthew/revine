"use client";

import { WalletIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PageContainer, panelClass } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletButton } from "@/components/wallet-button";
import { useWallet } from "@/lib/hooks";
import { MESSAGES } from "@/lib/messages";
import { cn } from "@/lib/utils";

/** Dashboards need a wallet: show "Connect your wallet to continue." until there is one (§9.1). */
export function WalletGate({ children }: { children: ReactNode }) {
  const { isConnected, isConnecting } = useWallet();

  if (isConnecting) {
    return (
      <>
        <div className="h-64 bg-brand-900 sm:h-80" />
        <PageContainer overlap>
          <Skeleton className="h-64 w-full rounded-3xl" />
        </PageContainer>
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <div className="h-40 bg-brand-900 sm:h-48" />
        <PageContainer overlap className="items-center">
          <div className={cn(panelClass, "flex w-full max-w-md flex-col items-center gap-5 px-6 py-12 text-center")}>
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-900 text-mint">
              <WalletIcon className="size-6" />
            </span>
            <p className="text-xl font-bold tracking-tight text-ink">{MESSAGES.notConnected}</p>
            <WalletButton className="h-12 px-7 text-base" />
          </div>
        </PageContainer>
      </>
    );
  }

  return children;
}
