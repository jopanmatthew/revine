// Company profiles, profile ads and closed-invoice outcomes. Pure functions over
// on-chain invoice data; only the ads come from off-chain. No imports beyond types, so
// `node --test` can run company-profiles.test.ts directly.
import type { Address, Invoice } from "./types";

const DAY = 86_400;

export interface ProfileAd {
  seller: Address;
  tier: number; // higher pins higher
  bid: number; // Rupiah per day, breaks ties within a tier
  endsAt: number; // unix seconds; the ad is active while now < endsAt
}

export interface CompanyProfile {
  seller: Address;
  invoices: number;
  financed: number;
  repaidOnTimeRate: number | null; // null until any financed invoice is paid or overdue
  confirmedRate: number | null; // null until a buyer has answered
  financedVolume: bigint;
  minInvoice: bigint;
  maxInvoice: bigint;
  openAmount: bigint;
  openCount: number;
  avgDaysToFinance: number | null;
  topBuyers: Address[];
}

function key(address: string) {
  return address.toLowerCase();
}

export function companyProfiles(invoices: Invoice[], now: number): CompanyProfile[] {
  const bySeller = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    const list = bySeller.get(key(inv.seller)) ?? [];
    list.push(inv);
    bySeller.set(key(inv.seller), list);
  }

  return [...bySeller.values()].map((list) => {
    const financed = list.filter((inv) => inv.financedAt > 0);
    const repaid = financed.filter((inv) => inv.status === "Paid");
    const overdue = financed.filter((inv) => inv.status === "Financed" && now > inv.dueDate);
    const onTime = repaid.filter((inv) => inv.paidAt <= inv.dueDate).length;
    const settled = repaid.length + overdue.length;
    const answered = list.filter((inv) => inv.respondedAt > 0);
    const confirmed = answered.filter((inv) => inv.status !== "Rejected").length;
    const open = list.filter((inv) => inv.status === "Listed" && now < inv.dueDate);
    const toFinance = financed.filter((inv) => inv.listedAt > 0 && inv.financedAt >= inv.listedAt);

    const buyerCounts = new Map<string, { address: Address; n: number }>();
    for (const inv of list) {
      const entry = buyerCounts.get(key(inv.buyer)) ?? { address: inv.buyer, n: 0 };
      entry.n++;
      buyerCounts.set(key(inv.buyer), entry);
    }

    const amounts = list.map((inv) => inv.faceAmount);
    return {
      seller: list[0].seller,
      invoices: list.length,
      financed: financed.length,
      repaidOnTimeRate: settled > 0 ? onTime / settled : null,
      confirmedRate: answered.length > 0 ? confirmed / answered.length : null,
      financedVolume: financed.reduce((sum, inv) => sum + inv.faceAmount, 0n),
      minInvoice: amounts.reduce((a, b) => (b < a ? b : a)),
      maxInvoice: amounts.reduce((a, b) => (b > a ? b : a)),
      openAmount: open.reduce((sum, inv) => sum + inv.askPrice, 0n),
      openCount: open.length,
      avgDaysToFinance:
        toFinance.length > 0
          ? toFinance.reduce((sum, inv) => sum + (inv.financedAt - inv.listedAt), 0) / toFinance.length / DAY
          : null,
      topBuyers: [...buyerCounts.values()].sort((a, b) => b.n - a.n).slice(0, 2).map((b) => b.address),
    };
  });
}

export interface RankedProfile {
  profile: CompanyProfile;
  ad: ProfileAd | null; // set only when an active ad pinned this row
}

/**
 * Active profile ads pin to the top (tier, then bid); everyone else follows by Rupiah financed.
 * Each company appears once, and the ad never touches the profile itself.
 */
export function rankProfiles(profiles: CompanyProfile[], ads: ProfileAd[], now: number): RankedProfile[] {
  const activeAds = new Map<string, ProfileAd>();
  for (const ad of ads) {
    if (now >= ad.endsAt) continue;
    const current = activeAds.get(key(ad.seller));
    if (!current || ad.tier > current.tier || (ad.tier === current.tier && ad.bid > current.bid)) {
      activeAds.set(key(ad.seller), ad);
    }
  }

  const ranked = profiles.map((profile) => ({ profile, ad: activeAds.get(key(profile.seller)) ?? null }));
  return ranked.sort((a, b) => {
    if (a.ad && b.ad) return b.ad.tier - a.ad.tier || b.ad.bid - a.ad.bid;
    if (a.ad || b.ad) return a.ad ? -1 : 1;
    return b.profile.financedVolume > a.profile.financedVolume ? 1 : b.profile.financedVolume < a.profile.financedVolume ? -1 : 0;
  });
}

export type OutcomeKind = "repaid" | "repaid-late" | "financed" | "defaulted" | "rejected" | "expired";

export interface Outcome {
  kind: OutcomeKind;
  label: string;
  reason: string;
  failed: boolean;
}

/** Closed means sold, repaid, rejected or expired: anything an investor can no longer buy. */
export function isClosed(invoice: Invoice, now: number): boolean {
  return (
    invoice.status === "Financed" ||
    invoice.status === "Paid" ||
    invoice.status === "Rejected" ||
    (invoice.status === "Listed" && now > invoice.dueDate)
  );
}

function days(n: number) {
  const whole = Math.max(1, Math.round(n));
  return `${whole} ${whole === 1 ? "day" : "days"}`;
}

/** The plain status-and-reason line for a closed invoice in the Companies view. */
export function invoiceOutcome(invoice: Invoice, now: number): Outcome {
  if (invoice.status === "Rejected") {
    return {
      kind: "rejected",
      label: "Rejected by buyer",
      reason: "The buyer didn't confirm this invoice, so it was never minted or sold. No reason is recorded on-chain.",
      failed: true,
    };
  }
  if (invoice.status === "Listed") {
    return {
      kind: "expired",
      label: "Listing expired",
      reason: "Listed for financing, but no financier bought it before the due date, so it can't be sold anymore.",
      failed: true,
    };
  }
  if (invoice.status === "Paid") {
    const late = (invoice.paidAt - invoice.dueDate) / DAY;
    if (late > 0) {
      return {
        kind: "repaid-late",
        label: "Repaid late",
        reason: `Repaid in full, ${days(late)} after the due date.`,
        failed: false,
      };
    }
    return {
      kind: "repaid",
      label: "Repaid on time",
      reason:
        invoice.financedAt > 0
          ? "Repaid in full on time, straight to the financier who held it."
          : "Repaid in full on time, straight to the seller (never financed).",
      failed: false,
    };
  }
  // Financed
  if (now > invoice.dueDate) {
    return {
      kind: "defaulted",
      label: "Overdue",
      reason: `Buyer hasn't paid: ${days((now - invoice.dueDate) / DAY)} past the due date. The financier holds the risk.`,
      failed: true,
    };
  }
  return {
    kind: "financed",
    label: "Sold, not due yet",
    reason: "A financier bought it. The buyer pays the full amount to them by the due date.",
    failed: false,
  };
}
