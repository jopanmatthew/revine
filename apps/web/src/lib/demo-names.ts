// Address → demo name for the demo cast (PRD §4).
// TODO(Jovan): replace these placeholder addresses with the real demo wallets (§18.4).
import type { Address } from "@/lib/types";

export const DEMO_WALLETS = {
  seller: { name: "Beras Bu Sari", address: "0xf35667bf47e7f305223d9d0fd656ce01f8deca15" },
  buyer: { name: "RM Selera Kita", address: "0x16b5b48ae8740d06ade451e44395477d4414f558" },
  financier: { name: "Modal Maju", address: "0x26e23a309b5e332cb286364362586aea057b1797" },
} as const satisfies Record<string, { name: string; address: Address }>;

const NAMES = new Map<string, string>(
  Object.values(DEMO_WALLETS).map(({ name, address }) => [address.toLowerCase(), name]),
);

/** The demo name for a known address, otherwise undefined. */
export function demoName(address?: string | null): string | undefined {
  return address ? NAMES.get(address.toLowerCase()) : undefined;
}

export function sameAddress(a?: string | null, b?: string | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}
