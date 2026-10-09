"use client";

import { SEPOLIA_CHAIN_ID, USE_MOCKS, ZK_PROOFS_ENABLED } from "@/lib/config";
import { CONTRACTS_CONFIGURED, MOCK_IDR_ABI, MOCK_IDR_ADDRESS, REVINE_INVOICE_ABI, REVINE_INVOICE_ADDRESS } from "@/lib/contracts";
import { fingerprint, proveInvoice, randomSalt } from "@/lib/fingerprint";
import { proveCircuit, type ProofResult } from "@/lib/zk/prover";
import { mockActions } from "@/lib/mock-actions";
import {
  CONTRACT_ERROR_MESSAGES,
  detailsStorageErrorMessage,
  MESSAGES,
  type ContractErrorName,
} from "@/lib/messages";
import { getWalletVerification } from "@/lib/wallet-verification";
import type { Address, Attestation, CreateInvoiceInput, OnStep } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { decodeErrorResult, decodeEventLog, type Hex } from "viem";
import { useAccount, usePublicClient, useSignMessage, useWriteContract } from "wagmi";

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

class ActionFailure extends Error {}

function collectErrorData(error: unknown): Hex | undefined {
  const queue = [error];
  const seen = new Set<object>();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    const record = value as Record<string, unknown>;
    if (typeof record.data === "string" && /^0x[\da-fA-F]{8,}$/.test(record.data)) return record.data as Hex;
    for (const key of ["cause", "error", "details"]) {
      if (record[key] && typeof record[key] === "object") queue.push(record[key]);
    }
  }
  return undefined;
}

function collectErrorText(error: unknown): string {
  const queue = [error];
  const seen = new Set<object>();
  const messages: string[] = [];
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") messages.push(record.message);
    if (typeof record.shortMessage === "string") messages.push(record.shortMessage);
    if (typeof record.name === "string") messages.push(record.name);
    for (const key of ["cause", "error"]) {
      if (record[key] && typeof record[key] === "object") queue.push(record[key]);
    }
  }
  return messages.join(" ");
}

function userRejected(error: unknown): boolean {
  const queue = [error];
  const seen = new Set<object>();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    const record = value as Record<string, unknown>;
    if (record.code === 4001 || (typeof record.name === "string" && record.name.includes("UserRejected"))) return true;
    if (record.cause && typeof record.cause === "object") queue.push(record.cause);
  }
  return false;
}

function messageFor(error: unknown): string {
  if (error instanceof ActionFailure) return error.message;
  if (userRejected(error)) return MESSAGES.userRejected;

  const data = collectErrorData(error);
  if (data) {
    try {
      const decoded = decodeErrorResult({ abi: REVINE_INVOICE_ABI, data });
      if (decoded.errorName in CONTRACT_ERROR_MESSAGES) {
        return CONTRACT_ERROR_MESSAGES[decoded.errorName as ContractErrorName];
      }
    } catch {
      // The revert may be an ERC-20 or RPC error rather than a revine custom error.
    }
  }

  const text = collectErrorText(error);
  const name = (Object.keys(CONTRACT_ERROR_MESSAGES) as ContractErrorName[]).find((errorName) =>
    new RegExp(`\\b${errorName}\\b`).test(text),
  );
  if (name) return CONTRACT_ERROR_MESSAGES[name];
  if (/insufficient funds|intrinsic transaction cost/i.test(text)) return MESSAGES.noEth;
  if (/network|timeout|fetch failed|gateway/i.test(text)) return MESSAGES.rpcBusy;
  return MESSAGES.generic;
}

interface ContractInvoice {
  id: bigint;
  seller: Address;
  buyer: Address;
  holder: Address;
  faceAmount: bigint;
  askPrice: bigint;
}

function useChainRevineActions(): RevineActions {
  const account = useAccount();
  const publicClient = usePublicClient({ chainId: SEPOLIA_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();

  function requireWallet(): Address {
    if (!account.address || account.status !== "connected") throw new ActionFailure(MESSAGES.notConnected);
    if (account.chainId !== SEPOLIA_CHAIN_ID) {
      throw new ActionFailure(MESSAGES.wrongNetwork(account.chain?.name ?? "another network"));
    }
    if (!publicClient) throw new ActionFailure(MESSAGES.rpcBusy);
    if (!CONTRACTS_CONFIGURED || !MOCK_IDR_ADDRESS || !REVINE_INVOICE_ADDRESS) {
      throw new ActionFailure(MESSAGES.generic);
    }
    return account.address;
  }

  async function run<T>(onStep: OnStep, action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      const message = messageFor(error);
      onStep("error", { error: message });
      throw new Error(message, { cause: error });
    }
  }

  async function sendAndWait(onStep: OnStep, write: () => Promise<Hex>) {
    onStep("wallet");
    const hash = await write();
    onStep("pending", { hash });
    if (!publicClient) throw new ActionFailure(MESSAGES.rpcBusy);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "reverted") throw new ActionFailure(MESSAGES.generic);
    void queryClient.invalidateQueries();
    return { hash, receipt };
  }

  async function readInvoice(id: bigint): Promise<ContractInvoice> {
    requireWallet();
    const value = await publicClient!.readContract({
      address: REVINE_INVOICE_ADDRESS!,
      abi: REVINE_INVOICE_ABI,
      functionName: "getInvoice",
      args: [id],
    });
    return value as ContractInvoice;
  }

  async function ensureAllowance(amount: bigint, onStep: OnStep) {
    const owner = requireWallet();
    const [balance, allowance] = await Promise.all([
      publicClient!.readContract({
        address: MOCK_IDR_ADDRESS!,
        abi: MOCK_IDR_ABI,
        functionName: "balanceOf",
        args: [owner],
      }),
      publicClient!.readContract({
        address: MOCK_IDR_ADDRESS!,
        abi: MOCK_IDR_ABI,
        functionName: "allowance",
        args: [owner, REVINE_INVOICE_ADDRESS!],
      }),
    ]);
    if (balance < amount) throw new ActionFailure(MESSAGES.noMidr(amount, balance));
    if (allowance >= amount) return;

    onStep("approving");
    await sendAndWait(onStep, () =>
      writeContractAsync({
        address: MOCK_IDR_ADDRESS!,
        abi: MOCK_IDR_ABI,
        functionName: "approve",
        args: [REVINE_INVOICE_ADDRESS!, amount],
        chainId: SEPOLIA_CHAIN_ID,
      }),
    );
  }

  return {
    async createInvoice(input, onStep) {
      return run(onStep, async () => {
        const seller = requireWallet();
        const faceAmount = input.items.reduce((sum, item) => sum + BigInt(item.qty) * BigInt(item.unitPrice), 0n);

        onStep("verify-wallet");
        let verification;
        try {
          verification = await getWalletVerification(seller, (message) => signMessageAsync({ message }));
        } catch (error) {
          if (userRejected(error)) throw new ActionFailure(MESSAGES.verificationDeclined);
          throw error;
        }

        const salt = randomSalt();
        const fingerprintInput = {
          seller,
          buyer: input.buyer,
          faceAmount: Number(faceAmount),
          dueDate: input.dueDate,
          items: input.items,
          description: input.description,
          salt,
        };
        let commitment: Hex;
        let proof: Hex = "0x";
        if (ZK_PROOFS_ENABLED) {
          onStep("proving");
          try {
            const generated = await proveInvoice(fingerprintInput);
            commitment = generated.commitment;
            proof = generated.proof;
          } catch {
            throw new ActionFailure(MESSAGES.proofFailed);
          }
        } else {
          commitment = await fingerprint(fingerprintInput);
        }
        onStep("saving-details");
        const response = await fetch("/api/details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            details: {
              commitment,
              seller,
              buyer: input.buyer,
              faceAmount: Number(faceAmount),
              dueDate: input.dueDate,
              items: input.items,
              description: input.description,
              salt,
            },
            walletVerification: verification,
          }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { code?: unknown } | null;
          throw new ActionFailure(
            detailsStorageErrorMessage(payload?.code) ?? MESSAGES.detailsMissingSeller,
          );
        }

        const { receipt, hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: REVINE_INVOICE_ADDRESS!,
            abi: REVINE_INVOICE_ABI,
            functionName: "createInvoice",
            args: [input.buyer, faceAmount, BigInt(input.dueDate), commitment, proof],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );

        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== REVINE_INVOICE_ADDRESS!.toLowerCase()) continue;
          try {
            const event = decodeEventLog({
              abi: REVINE_INVOICE_ABI,
              eventName: "InvoiceCreated",
              data: log.data,
              topics: log.topics,
            });
            onStep("success", { hash });
            return event.args.id;
          } catch {
            // Other logs in the receipt are ignored.
          }
        }
        throw new ActionFailure(MESSAGES.generic);
      });
    },

    async confirmInvoice(id, onStep) {
      await run(onStep, async () => {
        requireWallet();
        const { hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: REVINE_INVOICE_ADDRESS!,
            abi: REVINE_INVOICE_ABI,
            functionName: "confirmInvoice",
            args: [id],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );
        onStep("success", { hash });
      });
    },

    async rejectInvoice(id, onStep) {
      await run(onStep, async () => {
        requireWallet();
        const { hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: REVINE_INVOICE_ADDRESS!,
            abi: REVINE_INVOICE_ABI,
            functionName: "rejectInvoice",
            args: [id],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );
        onStep("success", { hash });
      });
    },

    async listInvoice(id, askPrice, onStep) {
      await run(onStep, async () => {
        requireWallet();
        const { hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: REVINE_INVOICE_ADDRESS!,
            abi: REVINE_INVOICE_ABI,
            functionName: "listInvoice",
            args: [id, askPrice],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );
        onStep("success", { hash });
      });
    },

    async unlistInvoice(id, onStep) {
      await run(onStep, async () => {
        requireWallet();
        const { hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: REVINE_INVOICE_ADDRESS!,
            abi: REVINE_INVOICE_ABI,
            functionName: "unlistInvoice",
            args: [id],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );
        onStep("success", { hash });
      });
    },

    async buyInvoice(id, onStep) {
      await run(onStep, async () => {
        requireWallet();
        const invoice = await readInvoice(id);
        await ensureAllowance(invoice.askPrice, onStep);
        const { hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: REVINE_INVOICE_ADDRESS!,
            abi: REVINE_INVOICE_ABI,
            functionName: "buyInvoice",
            args: [id],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );
        onStep("success", { hash });
      });
    },

    async repayInvoice(id, onStep) {
      await run(onStep, async () => {
        requireWallet();
        const invoice = await readInvoice(id);
        await ensureAllowance(invoice.faceAmount, onStep);
        const { hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: REVINE_INVOICE_ADDRESS!,
            abi: REVINE_INVOICE_ABI,
            functionName: "repayInvoice",
            args: [id],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );
        onStep("success", { hash });
      });
    },

    async getAttestation(): Promise<Attestation> {
      const seller = requireWallet();
      const response = await fetch("/api/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller }),
      });
      if (!response.ok) throw new Error(MESSAGES.attesterUnavailable);
      return (await response.json()) as Attestation;
    },

    async publishCreditBadge(threshold, attestation, onStep) {
      await run(onStep, async () => {
        const seller = requireWallet();
        if (!ZK_PROOFS_ENABLED) throw new ActionFailure(MESSAGES.proofFailed);
        if (!/^0x[0-9a-fA-F]{128}$/.test(attestation.signature)) {
          throw new ActionFailure(MESSAGES.proofFailed);
        }

        onStep("proving");
        let generated: ProofResult;
        try {
          const signature = attestation.signature.slice(2).match(/.{2}/g)!.map((byte) => String(Number.parseInt(byte, 16)));
          generated = await proveCircuit("credit", {
            seller: BigInt(seller).toString(),
            threshold: threshold.toString(),
            attested_at: BigInt(attestation.attestedAt).toString(),
            revenue: BigInt(attestation.revenue).toString(),
            signature,
          });
        } catch {
          throw new ActionFailure(MESSAGES.proofFailed);
        }
        const expectedInputs = [BigInt(seller), threshold, BigInt(attestation.attestedAt)];
        if (
          generated.publicInputs.length !== expectedInputs.length ||
          generated.publicInputs.some((value, index) => BigInt(value) !== expectedInputs[index])
        ) {
          throw new ActionFailure(MESSAGES.proofFailed);
        }

        const { hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: REVINE_INVOICE_ADDRESS!,
            abi: REVINE_INVOICE_ABI,
            functionName: "submitCreditProof",
            args: [threshold, BigInt(attestation.attestedAt), generated.proof],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );
        onStep("success", { hash });
      });
    },

    async faucet(onStep) {
      await run(onStep, async () => {
        requireWallet();
        const { hash } = await sendAndWait(onStep, () =>
          writeContractAsync({
            address: MOCK_IDR_ADDRESS!,
            abi: MOCK_IDR_ABI,
            functionName: "faucet",
            args: [],
            chainId: SEPOLIA_CHAIN_ID,
          }),
        );
        onStep("success", { hash });
      });
    },
  };
}

function useMockRevineActions(): RevineActions {
  return mockActions;
}

export const useRevineActions: () => RevineActions = USE_MOCKS ? useMockRevineActions : useChainRevineActions;
