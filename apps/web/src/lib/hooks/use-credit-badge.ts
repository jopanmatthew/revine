"use client";

import { USE_MOCKS } from "@/lib/config";
import { BADGE_VALIDITY_SECONDS } from "@/lib/config";
import { CONTRACTS_CONFIGURED, REVINE_INVOICE_ABI, REVINE_INVOICE_ADDRESS } from "@/lib/contracts";
import { nowSeconds } from "@/lib/format";
import type { Address, CreditBadge } from "@/lib/types";

import { useMockState } from "./use-mock-state";
import { zeroAddress } from "viem";
import { useReadContract } from "wagmi";

export interface CreditBadgeResult {
  badge: CreditBadge | null; // null without an address; a badge with verifiedAt 0 = no badge
  isLoading: boolean;
}

const NO_BADGE: CreditBadge = { threshold: 0n, attestedAt: 0, verifiedAt: 0, isValid: false };

function useMockCreditBadge(address?: Address): CreditBadgeResult {
  const { loaded, badges } = useMockState();
  if (!address) return { badge: null, isLoading: false };
  if (!loaded) return { badge: null, isLoading: true };
  return { badge: badges[address.toLowerCase()] ?? NO_BADGE, isLoading: false };
}

function useChainCreditBadge(address?: Address): CreditBadgeResult {
  const query = useReadContract({
    address: REVINE_INVOICE_ADDRESS ?? zeroAddress,
    abi: REVINE_INVOICE_ABI,
    functionName: "creditBadge",
    args: [address ?? zeroAddress],
    query: {
      enabled: CONTRACTS_CONFIGURED && !!address,
      refetchInterval: 60_000,
    },
  });

  if (!address || !query.data) {
    return { badge: address ? NO_BADGE : null, isLoading: !!address && CONTRACTS_CONFIGURED && query.isLoading };
  }

  const [threshold, attestedAt, verifiedAt] = query.data as readonly [bigint, bigint, bigint];
  const now = nowSeconds();
  const attestedAtSeconds = Number(attestedAt);
  return {
    badge: {
      threshold,
      attestedAt: attestedAtSeconds,
      verifiedAt: Number(verifiedAt),
      isValid:
        verifiedAt > 0n && now >= attestedAtSeconds && now - attestedAtSeconds <= BADGE_VALIDITY_SECONDS,
    },
    isLoading: query.isLoading,
  };
}

export const useCreditBadge: (address?: Address) => CreditBadgeResult = USE_MOCKS
  ? useMockCreditBadge
  : useChainCreditBadge;
