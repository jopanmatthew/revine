"use client";

import { ChevronDownIcon, WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { USE_MOCKS } from "@/lib/config";
import { demoName } from "@/lib/demo-names";
import { shortAddress } from "@/lib/format";
import { useWallet } from "@/lib/hooks";
import { useMockState } from "@/lib/hooks/use-mock-state";
import { MOCK_ACCOUNTS, mockStore, type MockAccountKey } from "@/lib/mock";

/** Connect button. In mock mode it switches between the demo accounts instead. */
export function WalletButton({ className }: { className?: string }) {
  return USE_MOCKS ? <MockWalletButton className={className} /> : <ChainWalletButton />;
}

// TODO(Jovan): RainbowKit <ConnectButton />.
function ChainWalletButton() {
  return null;
}

/** "Beras Bu Sari" → "BS". */
function initials(name: string): string {
  const words = name.split(/\s+/);
  return `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ""}`.toUpperCase();
}

function MockWalletButton({ className }: { className?: string }) {
  const { address, isConnected, isConnecting } = useWallet();
  const { account, wrongNetwork, cancelNextTx } = useMockState();

  if (isConnecting) return <Skeleton className="h-9 w-24 rounded-full" />;

  const name = demoName(address);
  const label = name ?? (address ? shortAddress(address) : "Connect wallet");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isConnected ? (
          <Button variant="outline" className={className ?? "h-9 gap-1.5 rounded-full bg-card px-2 sm:px-3"}>
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-900 text-[0.65rem] font-bold text-white">
              {name ? initials(name) : <WalletIcon className="size-3.5" />}
            </span>
            <span className="max-sm:sr-only">{label}</span>
            <ChevronDownIcon className="text-ink-muted" />
          </Button>
        ) : (
          <Button className={className ?? "h-9 rounded-full px-4"}>
            <WalletIcon data-icon="inline-start" />
            Connect wallet
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Mock wallet · pick a demo account</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={account ?? ""}
          onValueChange={(key) => mockStore.setAccount(key as MockAccountKey)}
        >
          {MOCK_ACCOUNTS.map((a) => (
            <DropdownMenuRadioItem key={a.key} value={a.key} className="flex-col items-start gap-0">
              <span>{a.label}</span>
              <span className="font-mono text-xs text-ink-muted">{shortAddress(a.address)}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {isConnected && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Simulate</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={wrongNetwork}
              onCheckedChange={(checked) => mockStore.update(() => ({ wrongNetwork: checked }))}
              onSelect={(e) => e.preventDefault()}
            >
              Wrong network
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={cancelNextTx}
              onCheckedChange={(checked) => mockStore.update(() => ({ cancelNextTx: checked }))}
              onSelect={(e) => e.preventDefault()}
            >
              Cancel the next wallet prompt
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => mockStore.setAccount(null)}>Disconnect</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
