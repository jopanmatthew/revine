"use client";

import { ChevronDownIcon, PencilIcon, WalletIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { USE_MOCKS } from "@/lib/config";
import { useDisplayNameLookup, useProfileName, saveProfileName } from "@/lib/profile-names";
import { shortAddress } from "@/lib/format";
import { useWallet } from "@/lib/hooks";
import { useMockState } from "@/lib/hooks/use-mock-state";
import { MOCK_ACCOUNTS, mockStore, type MockAccountKey } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

/** Connect button. In mock mode it switches between the demo accounts instead. */
type WalletButtonProps = { className?: string; connectedLabel?: string };

export function WalletButton(props: WalletButtonProps) {
  return USE_MOCKS ? <MockWalletButton {...props} /> : <ChainWalletButton {...props} />;
}

function ChainWalletButton({ className, connectedLabel }: WalletButtonProps) {
  const resolveName = useDisplayNameLookup();
  const [profileAddress, setProfileAddress] = useState<string>();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEditorKey, setProfileEditorKey] = useState(0);

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        if (!mounted) return <Skeleton className="h-9 w-24 rounded-full bg-white/10" />;

        if (!account || !chain) {
          return (
            <Button
              className={cn("h-9 justify-center gap-2 rounded-full bg-mint px-4 text-brand-900 hover:bg-white", className)}
              onClick={openConnectModal}
            >
              <WalletIcon data-icon="inline-start" />
              Connect wallet
            </Button>
          );
        }

        const name = resolveName(account.address);
        const label = connectedLabel ?? name;

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("h-9 gap-1.5 rounded-full border-white/15 bg-white/[0.06] px-1.5 text-white hover:bg-white/[0.12] hover:text-white focus-visible:border-white/30 focus-visible:ring-mint/40 aria-expanded:bg-white/[0.12] aria-expanded:text-white sm:px-3", className)}
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-mint text-[0.65rem] font-bold text-brand-900">
                    {name !== shortAddress(account.address) ? initials(name) : <WalletIcon className="size-3.5" />}
                  </span>
                  <span className={connectedLabel ? undefined : "max-lg:sr-only"}>{label}</span>
                  {chain.unsupported ? <span className="text-xs text-amber-300">Wrong network</span> : <ChevronDownIcon className="opacity-55" aria-hidden />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="space-y-1">
                  <span className="block">{name}</span>
                  <span className="block font-mono text-xs font-normal text-ink-muted">{shortAddress(account.address)}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { setProfileAddress(account.address); setProfileEditorKey((key) => key + 1); setProfileOpen(true); }}>
                  <PencilIcon /> Set display name
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => (chain.unsupported ? openChainModal() : openAccountModal())}>
                  <WalletIcon /> Wallet settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ProfileNameDialog key={profileEditorKey} address={profileAddress} open={profileOpen} onOpenChange={setProfileOpen} />
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}

/** "Beras Bu Sari" → "BS". */
function initials(name: string): string {
  const words = name.split(/\s+/);
  return `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ""}`.toUpperCase();
}

function MockWalletButton({ className, connectedLabel }: WalletButtonProps) {
  const { address, isConnected, isConnecting } = useWallet();
  const { account, wrongNetwork, cancelNextTx } = useMockState();
  const resolveName = useDisplayNameLookup();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEditorKey, setProfileEditorKey] = useState(0);

  if (isConnecting) return <Skeleton className="h-9 w-24 rounded-full bg-white/10" />;

  const name = address ? resolveName(address) : undefined;
  const label = connectedLabel ?? name ?? "Connect wallet";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {isConnected ? (
            <Button variant="outline" className={cn("h-9 gap-1.5 rounded-full border-white/15 bg-white/[0.06] px-1.5 text-white hover:bg-white/[0.12] hover:text-white focus-visible:border-white/30 focus-visible:ring-mint/40 aria-expanded:bg-white/[0.12] aria-expanded:text-white sm:px-3", className)}>
              <span className="flex size-6 items-center justify-center rounded-full bg-mint text-[0.65rem] font-bold text-brand-900">
                {address && name && name !== shortAddress(address) ? initials(name) : <WalletIcon className="size-3.5" />}
              </span>
              <span className={connectedLabel ? undefined : "max-lg:sr-only"}>{label}</span>
              <ChevronDownIcon className="opacity-55" aria-hidden />
            </Button>
          ) : (
            <Button className={cn("h-9 justify-center gap-2 rounded-full bg-mint px-4 text-brand-900 hover:bg-white", className)}>
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
            <DropdownMenuItem onSelect={() => { setProfileEditorKey((key) => key + 1); setProfileOpen(true); }}>
              <PencilIcon /> Set display name
            </DropdownMenuItem>
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
            <DropdownMenuItem onSelect={() => mockStore.reset()}>Reset demo data</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => mockStore.loadWorstCase()}>Load worst-case data</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => mockStore.setAccount(null)}>Disconnect</DropdownMenuItem>
          </>
        )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileNameDialog key={profileEditorKey} address={address} open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}

function ProfileNameDialog({ address, open, onOpenChange }: { address?: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const savedName = useProfileName(address);
  const [draft, setDraft] = useState<string>();
  const [error, setError] = useState<string>();
  const value = draft ?? savedName ?? "";

  function save(name: string) {
    try {
      if (!address) return;
      saveProfileName(address, name);
      setError(undefined);
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this name.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set your display name</DialogTitle>
          <DialogDescription>This name is saved in this browser for this wallet. It doesn’t change your wallet address.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="wallet-display-name">Name</Label>
          <Input
            id="wallet-display-name"
            autoFocus
            maxLength={32}
            placeholder="e.g. Modal Maju"
            value={value}
            onChange={(event) => { setDraft(event.target.value); setError(undefined); }}
            onKeyDown={(event) => { if (event.key === "Enter") save(value); }}
          />
          <p className="text-xs text-ink-muted">Up to 32 characters · only visible on this device</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          {savedName && <Button variant="ghost" onClick={() => save("")}>Clear name</Button>}
          <Button onClick={() => save(value)} disabled={!value.trim() || value.trim() === savedName}>Save name</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
