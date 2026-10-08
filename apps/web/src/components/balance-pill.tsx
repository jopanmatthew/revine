"use client";

import { ChevronDownIcon, CoinsIcon, ExternalLinkIcon, FuelIcon } from "lucide-react";

import { RupiahAmount } from "@/components/rupiah-amount";
import { TxStepper, txSteps, useTxFlow } from "@/components/tx-stepper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { FAUCET_AMOUNT, LOW_GAS_WEI, SEPOLIA_FAUCET_URL } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import { useBalances, useRevineActions, useWallet } from "@/lib/hooks";

const FAUCET_STEPS = txSteps(["wallet", "pending", "success"], {
  success: `${formatNumber(FAUCET_AMOUNT)} test mIDR added ✓`,
});

/** "Rp100.000.000 mIDR" with the faucet and a Sepolia ETH link; amber dot when gas is low (§9.1). */
export function BalancePill() {
  const { address, isConnected } = useWallet();
  const { midr, eth, isLoading } = useBalances(address);
  const { faucet } = useRevineActions();
  const flow = useTxFlow();

  if (!isConnected) return null;
  if (isLoading) return <Skeleton className="h-9 w-36 rounded-full" />;

  const lowGas = eth < LOW_GAS_WEI;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 gap-1.5 rounded-full bg-card px-3">
            {lowGas && <span className="size-2 rounded-full bg-amber-500" aria-label="Low gas balance" />}
            <RupiahAmount value={midr} className="font-medium" />
            <span className="text-ink-muted max-sm:hidden">mIDR</span>
            <ChevronDownIcon className="text-ink-muted" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            Test Rupiah (mIDR): <RupiahAmount value={midr} />
          </DropdownMenuLabel>
          {lowGas && (
            <DropdownMenuLabel className="flex items-center gap-1.5 text-warning-foreground">
              <span className="size-2 rounded-full bg-amber-500" />
              Low gas balance
            </DropdownMenuLabel>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void flow.run(faucet)}>
            <CoinsIcon />
            Get {formatNumber(FAUCET_AMOUNT)} test mIDR
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={SEPOLIA_FAUCET_URL} target="_blank" rel="noreferrer">
              <FuelIcon />
              Get Sepolia ETH for gas
              <ExternalLinkIcon className="ml-auto text-ink-muted" />
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TxStepper flow={flow} title="Get test mIDR" steps={FAUCET_STEPS} />
    </>
  );
}
