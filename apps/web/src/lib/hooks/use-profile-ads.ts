"use client";

import { USE_MOCKS } from "@/lib/config";
import type { ProfileAd } from "@/lib/company-profiles";

import { useMockState } from "./use-mock-state";

export interface ProfileAdsResult {
  ads: ProfileAd[];
  isLoading: boolean;
}

const NO_ADS: ProfileAd[] = [];

function useMockProfileAds(): ProfileAdsResult {
  const { loaded, ads } = useMockState();
  return { ads: loaded ? ads : NO_ADS, isLoading: !loaded };
}

// TODO(Jovan): profile ads are off-chain (paid boosts, §7); fetch them from an API route when they
// go live. Until then there are no ads in real mode, so every profile ranks organically.
function useApiProfileAds(): ProfileAdsResult {
  return { ads: NO_ADS, isLoading: false };
}

/** Active and expired profile ads; rankProfiles() decides what they pin. */
export const useProfileAds: () => ProfileAdsResult = USE_MOCKS ? useMockProfileAds : useApiProfileAds;
