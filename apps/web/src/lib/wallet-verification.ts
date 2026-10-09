import type { Address } from "./types";

export interface WalletVerification {
  message: string;
  signature: `0x${string}`;
}

export function walletVerificationMessage(address: Address, issuedAt = new Date()): string {
  return [
    "revine. wants to verify your wallet.",
    `Address: ${address}`,
    `Issued at: ${issuedAt.toISOString()}`,
    "This free signature doesn't send a transaction.",
  ].join("\n");
}

function issuedAtMs(message: string): number | null {
  const match = message.match(/^revine\. wants to verify your wallet\.\nAddress: 0x[0-9a-fA-F]{40}\nIssued at: ([^\n]+)\nThis free signature doesn't send a transaction\.$/);
  if (!match) return null;
  const time = Date.parse(match[1]);
  return Number.isFinite(time) ? time : null;
}

function isRecentForAddress(verification: WalletVerification, address: Address): boolean {
  const match = verification.message.match(/\nAddress: (0x[0-9a-fA-F]{40})\n/);
  const issued = issuedAtMs(verification.message);
  if (!match || match[1].toLowerCase() !== address.toLowerCase() || issued === null) return false;
  const now = Date.now();
  return issued <= now + 5 * 60_000 && now - issued <= 24 * 60 * 60_000;
}

function storageKey(address: Address): string {
  return `revine.walletVerification.${address.toLowerCase()}`;
}

function readCached(address: Address): WalletVerification | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(address));
    if (!raw) return null;
    const value = JSON.parse(raw) as WalletVerification;
    return isRecentForAddress(value, address) ? value : null;
  } catch {
    return null;
  }
}

/** Reuses a recent signature for this wallet, otherwise asks for a free signature. */
export async function getWalletVerification(
  address: Address,
  signMessage: (message: string) => Promise<`0x${string}`>,
): Promise<WalletVerification> {
  if (typeof window !== "undefined") {
    const cached = readCached(address);
    if (cached) return cached;
  }

  const message = walletVerificationMessage(address);
  const verification = { message, signature: await signMessage(message) };

  try {
    window.sessionStorage.setItem(storageKey(address), JSON.stringify(verification));
  } catch {
    // Private browsing can deny session storage; the signed request still works for this call.
  }
  return verification;
}

export function encodeWalletVerification(verification: WalletVerification): string {
  return btoa(JSON.stringify(verification));
}
