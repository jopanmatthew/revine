"use client";

import { CoinsIcon } from "lucide-react";

import { TxStepper, txSteps, useTxFlow } from "@/components/tx-stepper";
import { Button } from "@/components/ui/button";
import { FAUCET_AMOUNT } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import { useBalances, useRevineActions, useWallet } from "@/lib/hooks";
import { MESSAGES } from "@/lib/messages";

const FAUCET_STEPS = txSteps(["wallet", "pending", "success"], {
  success: `${formatNumber(FAUCET_AMOUNT)} test mIDR added ✓`,
});

/** The connected wallet's mIDR, and whether it covers an amount. */
export function useCanAfford(amount: bigint) {
  const { address } = useWallet();
  const { midr, isLoading } = useBalances(address);
  return { midr, isLoading, enough: !isLoading && midr >= amount };
}

/** "You need Rp10.000.000 mIDR but have Rp2.000.000," with the faucet right there. */
export function BalanceShortfall({ need, have }: { need: bigint; have: bigint }) {
  const { faucet } = useRevineActions();
  const flow = useTxFlow();

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-warning px-3.5 py-3 text-warning-foreground sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium">{MESSAGES.noMidr(need, have)}</p>
      <Button
        variant="outline"
        className="h-10 shrink-0 border-warning-foreground/25 bg-card text-ink"
        onClick={() => void flow.run(faucet)}
      >
        <CoinsIcon data-icon="inline-start" />
        Get test mIDR
      </Button>
      <TxStepper flow={flow} title="Get test mIDR" steps={FAUCET_STEPS} />
    </div>
  );
}
