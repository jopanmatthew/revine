"use client";

import { WalletIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { WalletButton } from "@/components/wallet-button";
import { useWallet } from "@/lib/hooks";
import { MESSAGES } from "@/lib/messages";

/** Dashboards need a wallet: show "Connect your wallet to continue." until there is one (§9.1). */
export function WalletGate({ children }: { children: ReactNode }) {
  const { isConnected, isConnecting } = useWallet();

  if (isConnecting) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="mx-auto mt-12 flex max-w-sm flex-col items-center gap-4 rounded-xl bg-card px-6 py-10 text-center ring-1 ring-foreground/10">
        <WalletIcon className="size-8 text-brand-700" />
        <p className="font-medium">{MESSAGES.notConnected}</p>
        <WalletButton className="h-11 px-5" />
      </div>
    );
  }

  return children;
}
