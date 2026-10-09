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
import { formatNumber, formatRupiahCompact } from "@/lib/format";
import { useBalances, useRevineActions, useWallet } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const FAUCET_STEPS = txSteps(["wallet", "pending", "success"], {
  success: `${formatNumber(FAUCET_AMOUNT)} test mIDR added ✓`,
});

/** "Rp100.000.000 mIDR" with the faucet and a Sepolia ETH link; amber dot when gas is low. */
export function BalancePill() {
  const { address, isConnected } = useWallet();
  const { midr, eth, isLoading } = useBalances(address);
  const { faucet } = useRevineActions();
  const flow = useTxFlow();

  if (!isConnected) return null;
  if (isLoading) return <Skeleton className="h-9 w-36 rounded-full bg-white/10" />;

  const lowGas = eth < LOW_GAS_WEI;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 gap-1.5 rounded-full border-white/15 bg-white/[0.06] px-3 text-white hover:bg-white/[0.12] hover:text-white focus-visible:border-white/30 focus-visible:ring-mint/40 aria-expanded:bg-white/[0.12] aria-expanded:text-white">
            {lowGas && <span className="size-2 rounded-full bg-amber-500" aria-label="Low gas balance" />}
            {/* Full amount where it fits; "Rp10 M" / "Rp25,4 jt" on very narrow phones or huge balances. */}
            <RupiahAmount
              value={midr}
              className={cn("font-medium", midr >= 1_000_000_000n ? "max-[420px]:hidden" : "max-[360px]:hidden")}
            />
            <span
              className={cn(
                "font-medium tabular-nums",
                midr >= 1_000_000_000n ? "min-[421px]:hidden" : "min-[361px]:hidden",
              )}
            >
              {formatRupiahCompact(midr)}
            </span>
            <span className="text-white/55 max-sm:hidden">mIDR</span>
            <ChevronDownIcon className="text-white/55" />
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
