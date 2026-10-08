"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/hooks";
import { MESSAGES } from "@/lib/messages";

/** Shown when the wallet is on another network. Actions stay disabled until it switches (§9.1). */
export function NetworkBanner() {
  const { isWrongNetwork, networkName, switchToSepolia } = useWallet();
  if (!isWrongNetwork) return null;

  return (
    <div role="alert" className="bg-warning text-warning-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <TriangleAlertIcon className="size-4 shrink-0" />
          {MESSAGES.wrongNetwork(networkName ?? "another network")}
        </p>
        <Button size="sm" onClick={switchToSepolia}>
          Switch to Sepolia
        </Button>
      </div>
    </div>
  );
}
