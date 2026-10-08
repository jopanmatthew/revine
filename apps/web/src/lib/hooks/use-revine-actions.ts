"use client";

import { USE_MOCKS } from "@/lib/config";
import { mockActions } from "@/lib/mock-actions";
import type { Attestation, CreateInvoiceInput, OnStep } from "@/lib/types";

import { NOT_WIRED } from "./not-wired";

/**
 * Every action reports its progress through onStep, and TxStepper renders it.
 * On failure the action calls onStep('error', { error: <§11 message> }) and rejects.
 */
export interface RevineActions {
  createInvoice(input: CreateInvoiceInput, onStep: OnStep): Promise<bigint>; // returns the new invoice id
  confirmInvoice(id: bigint, onStep: OnStep): Promise<void>;
  rejectInvoice(id: bigint, onStep: OnStep): Promise<void>;
  listInvoice(id: bigint, askPrice: bigint, onStep: OnStep): Promise<void>;
  unlistInvoice(id: bigint, onStep: OnStep): Promise<void>;
  buyInvoice(id: bigint, onStep: OnStep): Promise<void>;
  repayInvoice(id: bigint, onStep: OnStep): Promise<void>;
  getAttestation(): Promise<Attestation>;
  publishCreditBadge(threshold: bigint, attestation: Attestation, onStep: OnStep): Promise<void>; // calls submitCreditProof
  faucet(onStep: OnStep): Promise<void>;
}

const notWired = async (): Promise<never> => {
  throw NOT_WIRED;
};

// TODO(Jovan): wagmi writeContract + waitForTransactionReceipt, approvals only when the
// allowance is too low (§7), reverts mapped to CONTRACT_ERROR_MESSAGES (§11).
const chainActions: RevineActions = {
  createInvoice: notWired,
  confirmInvoice: notWired,
  rejectInvoice: notWired,
  listInvoice: notWired,
  unlistInvoice: notWired,
  buyInvoice: notWired,
  repayInvoice: notWired,
  getAttestation: notWired,
  publishCreditBadge: notWired,
  faucet: notWired,
};

function useMockRevineActions(): RevineActions {
  return mockActions;
}

function useChainRevineActions(): RevineActions {
  return chainActions;
}

export const useRevineActions: () => RevineActions = USE_MOCKS ? useMockRevineActions : useChainRevineActions;
