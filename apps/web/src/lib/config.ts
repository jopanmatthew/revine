// App config: public env flags (PRD §12.4; NEXT_PUBLIC_* values are inlined at build time)
// and the fixed rules from §7.

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Enable only after matching circuit verifiers are deployed and configured. */
export const ZK_PROOFS_ENABLED = process.env.NEXT_PUBLIC_ZK_PROOFS_ENABLED === "true";

export const SEPOLIA_CHAIN_ID = 11155111;
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? SEPOLIA_CHAIN_ID);

export const ETHERSCAN_URL = "https://sepolia.etherscan.io";
export const SEPOLIA_FAUCET_URL = "https://www.alchemy.com/faucets/ethereum-sepolia";

/** Below this Sepolia ETH balance (0,01 ETH, in wei) the balance pill shows "Low gas balance" (§9.1). */
export const LOW_GAS_WEI = 10_000_000_000_000_000n;

/** A credit badge is valid for 30 days from the attestation time (§7). */
export const BADGE_VALIDITY_SECONDS = 30 * 86_400;

/** mIDR minted by MockIDR.faucet() (§7). */
export const FAUCET_AMOUNT = 100_000_000n;

export function etherscanTxUrl(hash: string): string {
  return `${ETHERSCAN_URL}/tx/${hash}`;
}

/** Repo link for the landing footer (§9.2). Hidden until the public repo exists. */
export const GITHUB_URL: string | null = null; // TODO: set when the repo is public
