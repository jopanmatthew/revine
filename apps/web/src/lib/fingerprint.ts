import { bytesToHex, encodeAbiParameters, keccak256, toHex, type Hex } from "viem";

import { executeInvoiceCircuit, proveCircuit } from "./zk/prover.ts";
import type { Address, InvoiceItem } from "./types";

export interface FingerprintInput {
  seller: Address;
  buyer: Address;
  faceAmount: number;
  dueDate: number;
  items: InvoiceItem[];
  description: string;
  salt: `0x${string}`;
}

/** First 31 SHA-256 bytes of the canonical text object, zero-padded to a 32-byte Field. */
export async function textHash(input: { description: string; itemNames: string[] }): Promise<`0x${string}`> {
  const serialized = JSON.stringify({ description: input.description, itemNames: input.itemNames });
  const digest = new Uint8Array(
    await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(serialized)),
  );
  const first31 = bytesToHex(digest.slice(0, 31));
  return toHex(BigInt(first31), { size: 32 });
}

function circuitInputs(
  input: FingerprintInput,
  itemTextHash: Hex,
): Record<string, string | string[]> {
  if (input.items.length < 1 || input.items.length > 5) throw new Error("Invoice needs 1 to 5 items.");

  const qty = [0, 1, 2, 3, 4].map((index) => BigInt(input.items[index]?.qty ?? 0)) as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];
  const unitPrice = [0, 1, 2, 3, 4].map((index) => BigInt(input.items[index]?.unitPrice ?? 0)) as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];
  return {
    seller: BigInt(input.seller).toString(),
    buyer: BigInt(input.buyer).toString(),
    face_amount: BigInt(input.faceAmount).toString(),
    due_date: BigInt(input.dueDate).toString(),
    qty: qty.map(String),
    unit_price: unitPrice.map(String),
    text_hash: BigInt(itemTextHash).toString(),
    salt: BigInt(input.salt).toString(),
  };
}

function commitmentValue(value: unknown): Hex {
  if (typeof value !== "string" && typeof value !== "bigint") {
    throw new Error("The invoice circuit returned an invalid commitment.");
  }
  return toHex(BigInt(value), { size: 32 });
}

/** Light-mode fingerprint used with the existing test verifier deployment. */
export async function fingerprint(input: FingerprintInput): Promise<Hex> {
  if (input.items.length < 1 || input.items.length > 5) throw new Error("Invoice needs 1 to 5 items.");
  const qty = [0, 1, 2, 3, 4].map((index) => BigInt(input.items[index]?.qty ?? 0)) as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];
  const unitPrice = [0, 1, 2, 3, 4].map((index) => BigInt(input.items[index]?.unitPrice ?? 0)) as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];
  const itemTextHash = await textHash({
    description: input.description,
    itemNames: input.items.map((item) => item.name),
  });
  return keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint64" },
        { type: "uint64[5]" },
        { type: "uint64[5]" },
        { type: "bytes32" },
        { type: "bytes32" },
      ],
      [
        input.seller,
        input.buyer,
        BigInt(input.faceAmount),
        BigInt(input.dueDate),
        qty,
        unitPrice,
        itemTextHash,
        input.salt,
      ],
    ),
  );
}

/** Circuit-derived commitment for the real invoice verifier deployment. */
export async function invoiceCircuitFingerprint(input: FingerprintInput): Promise<Hex> {
  const itemTextHash = await textHash({
    description: input.description,
    itemNames: input.items.map((item) => item.name),
  });
  const returnValue = await executeInvoiceCircuit(circuitInputs(input, itemTextHash));
  return commitmentValue(returnValue);
}

/** Generate the same circuit commitment plus its EVM-targeted proof. */
export async function proveInvoice(input: FingerprintInput): Promise<{ commitment: Hex; proof: Hex }> {
  const itemTextHash = await textHash({
    description: input.description,
    itemNames: input.items.map((item) => item.name),
  });
  const result = await proveCircuit("invoice", circuitInputs(input, itemTextHash));
  const commitment = commitmentValue(result.returnValue);
  const expected = [
    BigInt(input.seller),
    BigInt(input.buyer),
    BigInt(input.faceAmount),
    BigInt(input.dueDate),
    BigInt(commitment),
  ];
  if (result.publicInputs.length !== expected.length || result.publicInputs.some((value, index) => BigInt(value) !== expected[index])) {
    throw new Error("The invoice proof public inputs do not match the invoice.");
  }
  return { commitment, proof: result.proof };
}

/** A random 31-byte value represented as a zero-padded Field. */
export function randomSalt(): `0x${string}` {
  const random = globalThis.crypto.getRandomValues(new Uint8Array(31));
  return `0x00${bytesToHex(random).slice(2)}`;
}
