import "server-only";

import { isAddress, verifyMessage } from "viem";

export interface WalletVerification {
  message: string;
  signature: `0x${string}`;
}

const MESSAGE =
  /^revine\. wants to verify your wallet\.\nAddress: (0x[0-9a-fA-F]{40})\nIssued at: ([^\n]+)\nThis free signature doesn't send a transaction\.$/;

export function parseWalletVerification(value: unknown): WalletVerification | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.message !== "string" || typeof candidate.signature !== "string") return null;
  if (!/^0x[0-9a-fA-F]{130}$/.test(candidate.signature)) return null;
  return { message: candidate.message, signature: candidate.signature as `0x${string}` };
}

export async function verifyWallet(verification: WalletVerification): Promise<string | null> {
  const match = verification.message.match(MESSAGE);
  if (!match || !isAddress(match[1])) return null;

  const issuedAt = Date.parse(match[2]);
  if (!Number.isFinite(issuedAt)) return null;
  const now = Date.now();
  if (issuedAt > now + 5 * 60_000 || now - issuedAt > 24 * 60 * 60_000) return null;

  try {
    const valid = await verifyMessage({
      address: match[1],
      message: verification.message,
      signature: verification.signature,
    });
    return valid ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

export function decodeWalletVerificationHeader(header: string | null): WalletVerification | null {
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, "base64").toString("utf8");
    return parseWalletVerification(JSON.parse(decoded));
  } catch {
    return null;
  }
}
