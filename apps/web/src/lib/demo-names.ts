// Address → demo name for the demo cast (PRD §4).
// Demo wallets supplied for the Sepolia walkthrough (PRD §18.4).
import { shortAddress } from "@/lib/format";
import type { Address } from "@/lib/types";
import { DEMO_WALLETS } from "./demo-wallets";

export { DEMO_WALLETS };

/** Fictional businesses that exist only in mock data, so the Companies list (§9.9) has a field and buyers have names. */
export const MOCK_BUSINESSES = {
  rasa: { name: "Toko Rasa Nusantara", address: "0xb9c15b91c205c8240690197791a9cfd24d3e3be0" },
  konveksi: { name: "Konveksi Maju Jaya", address: "0x5c1e8a7d2b904f63c1e0a9d84b7f2c35e6d10a91" },
  percetakan: { name: "Percetakan Sinar Abadi", address: "0x2d7b49e1c86a05f3d2b7e9c40a1f86d3b25c7e48" },
  // Buyers
  kopi: { name: "Kedai Kopi Lestari", address: "0xc02a4e67da21c9bd4c955bb930d423da61f18276" },
  hotel: { name: "Hotel Puri Asri", address: "0x9a4f62c8e1d07b35a9f4c26e8d10b7a3c5e92f61" },
  katering: { name: "Katering Ibu Ani", address: "0x7e1d3a90c4b25f86e0a1d47b3c9f2e58a6b10d24" },
} as const satisfies Record<string, { name: string; address: Address }>;

const NAMES = new Map<string, string>(
  [...Object.values(DEMO_WALLETS), ...Object.values(MOCK_BUSINESSES)].map(({ name, address }) => [
    address.toLowerCase(),
    name,
  ]),
);

/** The demo name for a known address, otherwise undefined. */
export function demoName(address?: string | null): string | undefined {
  return address ? NAMES.get(address.toLowerCase()) : undefined;
}

/** For running text: the demo name, otherwise "0x12…ab". */
export function displayName(address: string): string {
  return demoName(address) ?? shortAddress(address);
}

export function sameAddress(a?: string | null, b?: string | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}
