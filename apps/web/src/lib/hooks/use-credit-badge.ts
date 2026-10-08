"use client";

import { USE_MOCKS } from "@/lib/config";
import type { Address, CreditBadge } from "@/lib/types";

import { useMockState } from "./use-mock-state";

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

// TODO(Jovan): creditBadge(address); isValid = verifiedAt > 0 && now - attestedAt <= 30 days.
function useChainCreditBadge(address?: Address): CreditBadgeResult {
  void address;
  return { badge: null, isLoading: false };
}

export const useCreditBadge: (address?: Address) => CreditBadgeResult = USE_MOCKS
  ? useMockCreditBadge
  : useChainCreditBadge;
