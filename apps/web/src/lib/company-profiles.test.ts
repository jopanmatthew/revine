// Run with `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";

import { companyProfiles, invoiceOutcome, isClosed, rankProfiles, type ProfileAd } from "./company-profiles.ts";
import type { Address, Invoice, InvoiceStatus } from "./types.ts";

const DAY = 86_400;
const NOW = 1_800_000_000;
const A = "0xa000000000000000000000000000000000000001" as Address;
const B = "0xa000000000000000000000000000000000000002" as Address;
const C = "0xa000000000000000000000000000000000000003" as Address;
const BUYER = "0xb000000000000000000000000000000000000001" as Address;

let nextId = 1n;
function inv(p: {
  seller?: Address;
  status: InvoiceStatus;
  dueIn: number;
  financed?: boolean;
  paidAfterDue?: number;
  amount?: bigint;
  rejected?: boolean;
}): Invoice {
  const dueDate = NOW + p.dueIn * DAY;
  const listedAt = dueDate - 25 * DAY;
  return {
    id: nextId++,
    seller: p.seller ?? A,
    buyer: BUYER,
    holder: null,
    faceAmount: p.amount ?? 10_000_000n,
    askPrice: 9_700_000n,
    commitment: "0x00",
    dueDate,
    createdAt: dueDate - 30 * DAY,
    respondedAt: dueDate - 29 * DAY,
    listedAt: p.status === "Rejected" ? 0 : listedAt,
    financedAt: p.financed ? listedAt + 2 * DAY : 0,
    paidAt: p.paidAfterDue === undefined ? 0 : dueDate + p.paidAfterDue * DAY,
    status: p.status,
  };
}

test("a company profile counts financing, on-time repayment and buyer confirmations", () => {
  const list = [
    inv({ status: "Paid", dueIn: -30, financed: true, paidAfterDue: -1 }),
    inv({ status: "Paid", dueIn: -10, financed: true, paidAfterDue: 4 }),
    inv({ status: "Financed", dueIn: -2, financed: true }),
    inv({ status: "Rejected", dueIn: 20 }),
    inv({ status: "Listed", dueIn: 15, amount: 2_000_000n }),
  ];
  const [profile] = companyProfiles(list, NOW);
  assert.equal(profile.financed, 3);
  assert.equal(profile.repaidOnTimeRate, 1 / 3); // 1 on time of 3 paid-or-overdue
  assert.equal(profile.confirmedRate, 4 / 5);
  assert.equal(profile.financedVolume, 30_000_000n);
  assert.equal(profile.minInvoice, 2_000_000n);
  assert.equal(profile.openCount, 1);
  assert.equal(profile.avgDaysToFinance, 2);
});

test("active ads pin to the top by tier then bid; expired ads rank as organic", () => {
  const list = [
    inv({ seller: A, status: "Paid", dueIn: -5, financed: true, paidAfterDue: 0, amount: 50_000_000n }),
    inv({ seller: B, status: "Paid", dueIn: -5, financed: true, paidAfterDue: 0, amount: 5_000_000n }),
    inv({ seller: C, status: "Paid", dueIn: -5, financed: true, paidAfterDue: 0, amount: 20_000_000n }),
  ];
  const ads: ProfileAd[] = [
    { seller: B, tier: 1, bid: 50_000, endsAt: NOW + DAY },
    { seller: C, tier: 2, bid: 10_000, endsAt: NOW - 1 }, // expired
  ];
  const ranked = rankProfiles(companyProfiles(list, NOW), ads, NOW);
  assert.deepEqual(
    ranked.map((r) => [r.profile.seller, !!r.ad]),
    [
      [B, true],
      [A, false],
      [C, false],
    ],
  );
});

test("closed invoices explain their outcome", () => {
  assert.equal(invoiceOutcome(inv({ status: "Rejected", dueIn: 10 }), NOW).kind, "rejected");
  assert.equal(invoiceOutcome(inv({ status: "Listed", dueIn: -2 }), NOW).kind, "expired");
  const late = invoiceOutcome(inv({ status: "Paid", dueIn: -20, financed: true, paidAfterDue: 12 }), NOW);
  assert.equal(late.kind, "repaid-late");
  assert.match(late.reason, /12 days after/);
  const overdue = invoiceOutcome(inv({ status: "Financed", dueIn: -40, financed: true }), NOW);
  assert.equal(overdue.kind, "defaulted");
  assert.ok(overdue.failed);
  assert.equal(isClosed(inv({ status: "Listed", dueIn: 5 }), NOW), false);
  assert.equal(isClosed(inv({ status: "Verified", dueIn: 5 }), NOW), false);
});
