import { createHash } from "node:crypto";

import { isAddress, toHex, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { DEMO_WALLETS } from "../demo-wallets.ts";

const SECP256K1_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const SECP256K1_HALF_ORDER = SECP256K1_ORDER / 2n;
const MAX_UINT64 = 0xffffffffffffffffn;

export interface SignedAttestation {
  seller: Address;
  revenue: number;
  attestedAt: number;
  signature: Hex;
}

export class AttesterNotConfiguredError extends Error {}

export function attestationDigest(seller: Address, revenue: bigint, attestedAt: bigint): Hex {
  if (revenue < 0n || revenue > MAX_UINT64 || attestedAt < 0n || attestedAt > MAX_UINT64) {
    throw new RangeError("Attestation fields must fit in uint64.");
  }

  const encoded = Buffer.concat([
    Buffer.from(seller.slice(2), "hex"),
    uint64be(revenue),
    uint64be(attestedAt),
  ]);
  return toHex(createHash("sha256").update(encoded).digest());
}

export async function signAttestation(
  sellerInput: string,
  privateKey: Hex,
  attestedAt = Math.floor(Date.now() / 1000),
): Promise<SignedAttestation> {
  if (!isAddress(sellerInput)) throw new TypeError("Seller must be an Ethereum address.");
  if (!Number.isSafeInteger(attestedAt) || attestedAt < 0) throw new RangeError("Invalid attestation time.");

  const seller = sellerInput.toLowerCase() as Address;
  const revenue = seller === DEMO_WALLETS.seller.address.toLowerCase() ? 180_000_000 : 120_000_000;
  const digest = attestationDigest(seller, BigInt(revenue), BigInt(attestedAt));
  const signature65 = await privateKeyToAccount(privateKey).sign({ hash: digest });
  const r = signature65.slice(2, 66);
  const rawS = BigInt(`0x${signature65.slice(66, 130)}`);
  const normalizedS = rawS > SECP256K1_HALF_ORDER ? SECP256K1_ORDER - rawS : rawS;
  const s = normalizedS.toString(16).padStart(64, "0");

  return { seller, revenue, attestedAt, signature: `0x${r}${s}` as Hex };
}

export async function createDemoAttestation(seller: string): Promise<SignedAttestation> {
  const privateKey = process.env.ATTESTER_PRIVATE_KEY;
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new AttesterNotConfiguredError("The server attester key is not configured.");
  }
  return signAttestation(seller, privateKey as Hex);
}

function uint64be(value: bigint): Buffer {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(value);
  return bytes;
}
