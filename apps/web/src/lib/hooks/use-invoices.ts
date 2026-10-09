"use client";

import { USE_MOCKS } from "@/lib/config";
import { CONTRACTS_CONFIGURED, REVINE_INVOICE_ABI, REVINE_INVOICE_ADDRESS } from "@/lib/contracts";
import { STATUSES, type Address, type Invoice, type InvoiceStatus } from "@/lib/types";

import { useMockState } from "./use-mock-state";
import { zeroAddress } from "viem";
import { useReadContract } from "wagmi";

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
  refetch: () => void;
}

const NO_INVOICES: Invoice[] = [];
const noop = () => {};
const pollWhileVisible = () =>
  typeof document === "undefined" || document.visibilityState === "visible" ? 10_000 : false;

interface ContractInvoice {
  id: bigint;
  seller: Address;
  buyer: Address;
  holder: Address;
  faceAmount: bigint;
  askPrice: bigint;
  commitment: `0x${string}`;
  dueDate: bigint;
  createdAt: bigint;
  respondedAt: bigint;
  listedAt: bigint;
  financedAt: bigint;
  paidAt: bigint;
  status: number;
}

function fromContractInvoice(raw: ContractInvoice): Invoice {
  return {
    id: raw.id,
    seller: raw.seller,
    buyer: raw.buyer,
    holder: raw.holder === zeroAddress ? null : raw.holder,
    faceAmount: raw.faceAmount,
    askPrice: raw.askPrice,
    commitment: raw.commitment,
    dueDate: Number(raw.dueDate),
    createdAt: Number(raw.createdAt),
    respondedAt: Number(raw.respondedAt),
    listedAt: Number(raw.listedAt),
    financedAt: Number(raw.financedAt),
    paidAt: Number(raw.paidAt),
    status: STATUSES[Number(raw.status)] ?? ("Created" as InvoiceStatus),
  };
}

// Mock: the store is live, so there's nothing to poll and refetch is a no-op.
function useMockInvoices(): InvoicesResult {
  const { loaded, invoices } = useMockState();
  return { invoices: loaded ? invoices : NO_INVOICES, isLoading: !loaded, error: null, refetch: noop };
}

function useMockInvoice(id: bigint): InvoiceResult {
  const { loaded, invoices } = useMockState();
  return { invoice: loaded ? (invoices.find((inv) => inv.id === id) ?? null) : null, isLoading: !loaded, error: null, refetch: noop };
}

function useChainInvoices(): InvoicesResult {
  const address = REVINE_INVOICE_ADDRESS ?? zeroAddress;
  const countQuery = useReadContract({
    address,
    abi: REVINE_INVOICE_ABI,
    functionName: "invoiceCount",
    query: { enabled: CONTRACTS_CONFIGURED, refetchInterval: pollWhileVisible },
  });
  const count = countQuery.data ?? 0n;
  const invoicesQuery = useReadContract({
    address,
    abi: REVINE_INVOICE_ABI,
    functionName: "getInvoices",
    args: [0n, count],
    query: {
      enabled: CONTRACTS_CONFIGURED && countQuery.isSuccess,
      refetchInterval: pollWhileVisible,
    },
  });

  const refetch = () => {
    void countQuery.refetch();
    void invoicesQuery.refetch();
  };

  const rawInvoices = (invoicesQuery.data ?? []) as readonly ContractInvoice[];
  return {
    invoices: rawInvoices.map(fromContractInvoice),
    isLoading: CONTRACTS_CONFIGURED && (countQuery.isLoading || (countQuery.isSuccess && invoicesQuery.isLoading)),
    error: countQuery.error ?? invoicesQuery.error ?? null,
    refetch,
  };
}

function useChainInvoice(id: bigint): InvoiceResult {
  const address = REVINE_INVOICE_ADDRESS ?? zeroAddress;
  const countQuery = useReadContract({
    address,
    abi: REVINE_INVOICE_ABI,
    functionName: "invoiceCount",
    query: { enabled: CONTRACTS_CONFIGURED && id > 0n },
  });
  const exists = id > 0n && countQuery.data !== undefined && id <= countQuery.data;
  const invoiceQuery = useReadContract({
    address,
    abi: REVINE_INVOICE_ABI,
    functionName: "getInvoice",
    args: [id],
    query: { enabled: CONTRACTS_CONFIGURED && exists },
  });

  return {
    invoice: exists && invoiceQuery.data ? fromContractInvoice(invoiceQuery.data as ContractInvoice) : null,
    isLoading: CONTRACTS_CONFIGURED && id > 0n && (countQuery.isLoading || (exists && invoiceQuery.isLoading)),
    error: countQuery.error ?? invoiceQuery.error ?? null,
    refetch: () => {
      void countQuery.refetch();
      if (exists) void invoiceQuery.refetch();
    },
  };
}

/** All invoices, newest data every 10 s. */
export const useInvoices: () => InvoicesResult = USE_MOCKS ? useMockInvoices : useChainInvoices;

/** One invoice; null when the id doesn't exist. */
export const useInvoice: (id: bigint) => InvoiceResult = USE_MOCKS ? useMockInvoice : useChainInvoice;
