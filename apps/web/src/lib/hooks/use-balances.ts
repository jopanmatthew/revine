"use client";

import { USE_MOCKS } from "@/lib/config";
import { CONTRACTS_CONFIGURED, MOCK_IDR_ABI, MOCK_IDR_ADDRESS } from "@/lib/contracts";
import type { Address } from "@/lib/types";

import { useMockState } from "./use-mock-state";
import { zeroAddress } from "viem";
import { useBalance, useReadContract } from "wagmi";

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

function useChainBalances(address?: Address): BalancesResult {
  const midrQuery = useReadContract({
    address: MOCK_IDR_ADDRESS ?? zeroAddress,
    abi: MOCK_IDR_ABI,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    query: { enabled: CONTRACTS_CONFIGURED && !!address, refetchInterval: 10_000 },
  });
  const ethQuery = useBalance({
    address,
    chainId: 11155111,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  return {
    midr: midrQuery.data ?? 0n,
    eth: ethQuery.data?.value ?? 0n,
    isLoading: (!!address && ethQuery.isLoading) || (CONTRACTS_CONFIGURED && !!address && midrQuery.isLoading),
  };
}

export const useBalances: (address?: Address) => BalancesResult = USE_MOCKS ? useMockBalances : useChainBalances;
