"use client";

import { SEPOLIA_CHAIN_ID, USE_MOCKS } from "@/lib/config";
import { mockAccountAddress, mockStore } from "@/lib/mock";
import type { Address } from "@/lib/types";
import { useAccount, useSwitchChain } from "wagmi";

import { useIsClient, useMockState } from "./use-mock-state";

export interface WalletState {
  address?: Address; // undefined when not connected
  isConnected: boolean;
  isConnecting: boolean; // true while the wallet reconnects on page load
  chainId?: number;
  networkName?: string; // for "You're on {network}."
  isWrongNetwork: boolean; // connected, but not on Sepolia (11155111)
  switchToSepolia: () => void;
}

// Mock: the demo account picked in WalletButton.
function useMockWallet(): WalletState {
  const isClient = useIsClient();
  const { account, wrongNetwork } = useMockState();
  const address = isClient ? mockAccountAddress(account) : undefined;
  const isWrongNetwork = !!address && wrongNetwork;

  return {
    address,
    isConnected: !!address,
    isConnecting: !isClient,
    chainId: address ? (isWrongNetwork ? 1 : SEPOLIA_CHAIN_ID) : undefined,
    networkName: address ? (isWrongNetwork ? "Ethereum Mainnet" : "Sepolia") : undefined,
    isWrongNetwork,
    switchToSepolia: () => mockStore.update(() => ({ wrongNetwork: false })),
  };
}

function useChainWallet(): WalletState {
  // Wagmi may begin reconnecting before this boundary hydrates. Use the same
  // initial state on the server and client, then expose the restored account.
  const isClient = useIsClient();
  const account = useAccount();
  const { switchChain } = useSwitchChain();
  const chainId = isClient ? account.chainId : undefined;
  const isConnected = isClient && account.status === "connected";

  return {
    address: isConnected ? account.address : undefined,
    isConnected,
    isConnecting: !isClient || account.status === "connecting" || account.status === "reconnecting",
    chainId,
    networkName: isClient ? account.chain?.name : undefined,
    isWrongNetwork: isConnected && chainId !== SEPOLIA_CHAIN_ID,
    switchToSepolia: () => switchChain({ chainId: SEPOLIA_CHAIN_ID }),
  };
}

export const useWallet: () => WalletState = USE_MOCKS ? useMockWallet : useChainWallet;
