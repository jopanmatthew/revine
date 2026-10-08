"use client";

import { USE_MOCKS } from "@/lib/config";
import type { Address } from "@/lib/types";

import { useMockState } from "./use-mock-state";

export interface BalancesResult {
  midr: bigint; // rupiah (0 decimals)
  eth: bigint; // wei
  isLoading: boolean;
}

function useMockBalances(address?: Address): BalancesResult {
  const { loaded, balances } = useMockState();
  const balance = address ? balances[address.toLowerCase()] : undefined;
  return { midr: balance?.midr ?? 0n, eth: balance?.eth ?? 0n, isLoading: !!address && !loaded };
}

// TODO(Jovan): MockIDR balanceOf + Sepolia ETH balance; refetch after transactions.
function useChainBalances(address?: Address): BalancesResult {
  void address;
  return { midr: 0n, eth: 0n, isLoading: false };
}

export const useBalances: (address?: Address) => BalancesResult = USE_MOCKS ? useMockBalances : useChainBalances;
