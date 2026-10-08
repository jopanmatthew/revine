// Run with `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";

import { buyerRecord, pairHistory, recordSummary } from "./buyer-record.ts";
import type { Invoice, InvoiceStatus } from "./types.ts";

const DAY = 86_400;
const NOW = 1_800_000_000;
const BUYER = "0xb0000000000000000000000000000000000000b1";
const SELLER_A = "0xa000000000000000000000000000000000000001";
const SELLER_B = "0xa000000000000000000000000000000000000002";

let nextId = 1n;
function inv(p: {
  status: InvoiceStatus;
  financed?: boolean;
  dueIn: number; // days from NOW (negative = past)
  paidDaysAfterDue?: number;
  term?: number; // days between created and due
  amount?: bigint;
  seller?: string;
  buyer?: string;
}): Invoice {
  const dueDate = NOW + p.dueIn * DAY;
  return {
    id: nextId++,
    seller: (p.seller ?? SELLER_A) as `0x${string}`,
    buyer: (p.buyer ?? BUYER) as `0x${string}`,
    holder: null,
    faceAmount: p.amount ?? 10_000_000n,
    askPrice: 9_700_000n,
    commitment: "0x00",
    dueDate,
    createdAt: dueDate - (p.term ?? 30) * DAY,
    respondedAt: 0,
    listedAt: 0,
    financedAt: p.financed === false ? 0 : dueDate - 20 * DAY,
    paidAt: p.paidDaysAfterDue === undefined ? 0 : dueDate + p.paidDaysAfterDue * DAY,
    status: p.status,
  };
}

test("no financed history means a new buyer", () => {
  const record = buyerRecord([inv({ status: "Paid", financed: false, dueIn: -5, paidDaysAfterDue: -1 })], BUYER, NOW);
  assert.equal(record.tier, "new");
  assert.equal(recordSummary(record), "no payment record yet");
});

test("three on-time financed payments make a reliable buyer", () => {
  const list = [
    inv({ status: "Paid", dueIn: -40, paidDaysAfterDue: -2, seller: SELLER_A }),
    inv({ status: "Paid", dueIn: -20, paidDaysAfterDue: 0, seller: SELLER_B }),
    inv({ status: "Paid", dueIn: -5, paidDaysAfterDue: -1 }),
    inv({ status: "Paid", dueIn: -3, paidDaysAfterDue: 2, amount: 500_000n }), // small and late
  ];
  const record = buyerRecord(list, BUYER, NOW);
  assert.equal(record.tier, "reliable");
  assert.equal(record.onTime, 3);
  assert.equal(record.late, 1);
  assert.equal(record.maxDaysLate, 2);
  assert.equal(record.sellers, 2);
  assert.equal(recordSummary(record), "3 paid on time · 1 late");
});

test("any financed invoice left overdue makes a buyer risky", () => {
  const list = [
    inv({ status: "Paid", dueIn: -40, paidDaysAfterDue: 0 }),
    inv({ status: "Paid", dueIn: -30, paidDaysAfterDue: 0 }),
    inv({ status: "Paid", dueIn: -20, paidDaysAfterDue: 0 }),
    inv({ status: "Financed", dueIn: -3 }),
  ];
  assert.equal(buyerRecord(list, BUYER, NOW).tier, "risky");
});

test("short-term and self-financed invoices don't count, so a record can't be farmed", () => {
  const farmed = Array.from({ length: 10 }, () => inv({ status: "Paid", dueIn: -2, paidDaysAfterDue: 0, term: 2 }));
  const unfunded = Array.from({ length: 10 }, () =>
    inv({ status: "Paid", financed: false, dueIn: -10, paidDaysAfterDue: 0 }),
  );
  assert.equal(buyerRecord([...farmed, ...unfunded], BUYER, NOW).tier, "new");
});

test("pair history counts every paid invoice between one seller and one buyer", () => {
  const list = [
    inv({ status: "Paid", financed: false, dueIn: -40, paidDaysAfterDue: 0 }),
    inv({ status: "Paid", dueIn: -10, paidDaysAfterDue: 3 }),
    inv({ status: "Paid", dueIn: -10, paidDaysAfterDue: 0, seller: SELLER_B }),
  ];
  assert.deepEqual(pairHistory(list, SELLER_A, BUYER), { paid: 2, onTime: 1 });
});
