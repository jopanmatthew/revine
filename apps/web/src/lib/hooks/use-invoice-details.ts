"use client";

import { useCallback, useState } from "react";

import { sameAddress } from "@/lib/demo-names";
import { USE_MOCKS } from "@/lib/config";
import { MESSAGES } from "@/lib/messages";
import { mockAccountAddress, mockStore } from "@/lib/mock";
import type { InvoiceDetails } from "@/lib/types";

import { NOT_WIRED } from "./not-wired";

export interface InvoiceDetailsResult {
  details: InvoiceDetails | null;
  matches: boolean | null; // fingerprint check result; null until loaded
  load: () => Promise<void>; // asks for wallet verification if needed
  isLoading: boolean;
  error: Error | null;
}

interface DetailsState {
  details: InvoiceDetails | null;
  matches: boolean | null;
  isLoading: boolean;
  error: Error | null;
}

const IDLE: DetailsState = { details: null, matches: null, isLoading: false, error: null };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock: "verify your wallet", then "fetch" the details and check the fingerprint.
function useMockInvoiceDetails(commitment: `0x${string}`): InvoiceDetailsResult {
  const [state, setState] = useState<DetailsState>(IDLE);

  const load = useCallback(async () => {
    setState({ ...IDLE, isLoading: true });
    const fail = (message: string) => setState({ ...IDLE, error: new Error(message) });

    const { account, cancelNextTx } = mockStore.getState();
    const me = mockAccountAddress(account);
    if (!me) return fail(MESSAGES.notConnected);

    await sleep(600); // wallet verification signature
    if (cancelNextTx) {
      mockStore.update(() => ({ cancelNextTx: false }));
      return fail(MESSAGES.verificationDeclined);
    }

    await sleep(600); // GET /api/details
    const { invoices, details, mismatched } = mockStore.getState();
    const invoice = invoices.find((inv) => inv.commitment === commitment);
    if (!invoice || !(sameAddress(me, invoice.seller) || sameAddress(me, invoice.buyer))) {
      return fail(MESSAGES.detailsForbidden);
    }
    const found = details[commitment];
    if (!found) {
      return fail(sameAddress(me, invoice.seller) ? MESSAGES.detailsMissingSeller : MESSAGES.detailsMissingBuyer);
    }
    setState({ details: found, matches: !mismatched.includes(commitment), isLoading: false, error: null });
  }, [commitment]);

  return { ...state, load };
}

// TODO(Jovan): wallet verification (§15.3) → GET /api/details → fingerprint check (§14.2).
function useChainInvoiceDetails(commitment: `0x${string}`): InvoiceDetailsResult {
  void commitment;
  return { ...IDLE, error: NOT_WIRED, load: async () => {} };
}

export const useInvoiceDetails: (commitment: `0x${string}`) => InvoiceDetailsResult = USE_MOCKS
  ? useMockInvoiceDetails
  : useChainInvoiceDetails;
