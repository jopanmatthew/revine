// Buyer payment record (PRD §7): computed from on-chain invoice data, never stored. The chain holds
// every invoice's due date and paid time, so the record can't be edited by anyone.
// No imports beyond types, so `node --test` can run buyer-record.test.ts directly.
import type { Invoice } from "./types";

const SECONDS_PER_DAY = 86_400;
const MIN_TERM_SECONDS = 7 * SECONDS_PER_DAY;

export type BuyerTier = "new" | "reliable" | "mixed" | "risky";

export interface BuyerRecord {
  tier: BuyerTier;
  onTime: number;
  late: number;
  maxDaysLate: number;
  overdue: number;
  sellers: number; // different sellers among counted invoices
  onTimeRate: number; // 0–1, weighted by Rupiah amount; 0 when nothing counts
}

function same(a: string | null | undefined, b: string): boolean {
  return !!a && a.toLowerCase() === b.toLowerCase();
}

/**
 * Only invoices a financier funded (someone else's money was at risk) with a term of at least 7 days
 * count, so a seller and buyer can't build a record from small, quick, self-financed invoices.
 */
export function buyerRecord(invoices: Invoice[], buyer: string, now: number): BuyerRecord {
  let onTime = 0;
  let late = 0;
  let maxDaysLate = 0;
  let overdue = 0;
  let onTimeAmount = 0n;
  let countedAmount = 0n;
  const sellers = new Set<string>();

  for (const inv of invoices) {
    if (!same(inv.buyer, buyer) || inv.financedAt === 0) continue;
    if (inv.dueDate - inv.createdAt < MIN_TERM_SECONDS) continue;

    if (inv.status === "Paid") {
      countedAmount += inv.faceAmount;
      sellers.add(inv.seller.toLowerCase());
      if (inv.paidAt <= inv.dueDate) {
        onTime++;
        onTimeAmount += inv.faceAmount;
      } else {
        late++;
        maxDaysLate = Math.max(maxDaysLate, Math.ceil((inv.paidAt - inv.dueDate) / SECONDS_PER_DAY));
      }
    } else if (inv.status === "Financed" && now > inv.dueDate) {
      overdue++;
      countedAmount += inv.faceAmount;
      sellers.add(inv.seller.toLowerCase());
    }
  }

  const counted = onTime + late + overdue;
  const onTimeRate = countedAmount > 0n ? Number((onTimeAmount * 10_000n) / countedAmount) / 10_000 : 0;
  const tier: BuyerTier =
    counted === 0
      ? "new"
      : overdue > 0 || onTimeRate < 0.7
        ? "risky"
        : counted >= 3 && onTimeRate >= 0.9
          ? "reliable"
          : "mixed";

  return { tier, onTime, late, maxDaysLate, overdue, sellers: sellers.size, onTimeRate };
}

/** How many invoices this seller and buyer have settled together (for the cold start). */
export function pairHistory(invoices: Invoice[], seller: string, buyer: string): { paid: number; onTime: number } {
  let paid = 0;
  let onTime = 0;
  for (const inv of invoices) {
    if (!same(inv.seller, seller) || !same(inv.buyer, buyer) || inv.status !== "Paid") continue;
    paid++;
    if (inv.paidAt <= inv.dueDate) onTime++;
  }
  return { paid, onTime };
}

export const TIER_LABELS: Record<BuyerTier, string> = {
  new: "New buyer",
  reliable: "Reliable",
  mixed: "Mixed",
  risky: "Risky",
};

/** "6 paid on time · 1 late" / "no payment record yet". */
export function recordSummary(record: BuyerRecord): string {
  if (record.tier === "new") return "no payment record yet";
  const parts = [`${record.onTime} paid on time`];
  if (record.late > 0) parts.push(`${record.late} late`);
  if (record.overdue > 0) parts.push(`${record.overdue} overdue`);
  return parts.join(" · ");
}
