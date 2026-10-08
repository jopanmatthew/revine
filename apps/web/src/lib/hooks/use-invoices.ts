"use client";

import { USE_MOCKS } from "@/lib/config";
import type { Invoice } from "@/lib/types";

import { useMockState } from "./use-mock-state";
import { NOT_WIRED } from "./not-wired";

export interface InvoicesResult {
  invoices: Invoice[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface InvoiceResult {
  invoice: Invoice | null;
  isLoading: boolean;
  error: Error | null;
}

const NO_INVOICES: Invoice[] = [];
const noop = () => {};

// Mock: the store is live, so there's nothing to poll and refetch is a no-op.
function useMockInvoices(): InvoicesResult {
  const { loaded, invoices } = useMockState();
  return { invoices: loaded ? invoices : NO_INVOICES, isLoading: !loaded, error: null, refetch: noop };
}

function useMockInvoice(id: bigint): InvoiceResult {
  const { loaded, invoices } = useMockState();
  return { invoice: loaded ? (invoices.find((inv) => inv.id === id) ?? null) : null, isLoading: !loaded, error: null };
}

// TODO(Jovan): getInvoices(0, count) via wagmi; poll every 10 s while the tab is visible and
// refetch right after every successful transaction (§9.1).
function useChainInvoices(): InvoicesResult {
  return { invoices: NO_INVOICES, isLoading: false, error: NOT_WIRED, refetch: noop };
}

// TODO(Jovan): getInvoice(id); unknown id → invoice null.
function useChainInvoice(id: bigint): InvoiceResult {
  void id;
  return { invoice: null, isLoading: false, error: NOT_WIRED };
}

/** All invoices, newest data every 10 s. */
export const useInvoices: () => InvoicesResult = USE_MOCKS ? useMockInvoices : useChainInvoices;

/** One invoice; null when the id doesn't exist. */
export const useInvoice: (id: bigint) => InvoiceResult = USE_MOCKS ? useMockInvoice : useChainInvoice;
