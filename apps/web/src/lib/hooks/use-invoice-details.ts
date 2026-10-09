"use client";

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { USE_MOCKS, ZK_PROOFS_ENABLED } from "@/lib/config";
import { sameAddress } from "@/lib/demo-names";
import { detailsStorageErrorMessage, MESSAGES } from "@/lib/messages";
import { fingerprint, invoiceCircuitFingerprint } from "@/lib/fingerprint";
import { mockAccountAddress, mockStore } from "@/lib/mock";
import type { InvoiceDetails } from "@/lib/types";
import { encodeWalletVerification, getWalletVerification } from "@/lib/wallet-verification";

import { useInvoices } from "./use-invoices";

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

function useChainInvoiceDetails(commitment: `0x${string}`): InvoiceDetailsResult {
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { invoices } = useInvoices();
  const [state, setState] = useState<DetailsState>(IDLE);

  const load = useCallback(async () => {
    setState({ ...IDLE, isLoading: true });
    if (!account.address) {
      setState({ ...IDLE, error: new Error(MESSAGES.notConnected) });
      return;
    }

    try {
      const verification = await getWalletVerification(account.address, (message) =>
        signMessageAsync({ message }),
      );
      const response = await fetch(`/api/details?commitment=${encodeURIComponent(commitment)}`, {
        headers: { "x-revine-auth": encodeWalletVerification(verification) },
        cache: "no-store",
      });

      if (response.status === 403) throw new Error(MESSAGES.detailsForbidden);
      if (response.status === 404) {
        const invoice = invoices.find((item) => item.commitment.toLowerCase() === commitment.toLowerCase());
        const message = sameAddress(account.address, invoice?.seller)
          ? MESSAGES.detailsMissingSeller
          : MESSAGES.detailsMissingBuyer;
        throw new Error(message);
      }
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { code?: unknown } | null;
        throw new Error(detailsStorageErrorMessage(payload?.code) ?? MESSAGES.generic);
      }

      const details = (await response.json()) as InvoiceDetails;
      const calculated = await (ZK_PROOFS_ENABLED ? invoiceCircuitFingerprint(details) : fingerprint(details));
      setState({
        details,
        matches: calculated.toLowerCase() === commitment.toLowerCase(),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      const code = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
      const message =
        code === 4001 || name.includes("UserRejected")
          ? MESSAGES.verificationDeclined
          : error instanceof Error
            ? error.message
            : MESSAGES.generic;
      setState({ ...IDLE, error: new Error(message) });
    }
  }, [account.address, commitment, invoices, signMessageAsync]);

  return { ...state, load };
}

export const useInvoiceDetails: (commitment: `0x${string}`) => InvoiceDetailsResult = USE_MOCKS
  ? useMockInvoiceDetails
  : useChainInvoiceDetails;
