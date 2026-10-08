// Run with `npm test` (Node's built-in test runner strips the types).
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  annualizedReturn,
  daysToDue,
  dueDateInDays,
  formatDate,
  formatDateTime,
  formatDue,
  formatJuta,
  formatNumber,
  formatPercent,
  formatRupiah,
  formatTimeAgo,
  priceFromDiscount,
  profitOf,
  returnPercent,
  shortAddress,
  toDueDateSeconds,
  toWibDateString,
} from "./format.ts";

test("§7 worked example: Rp10.000.000 at 3% for 30 days", () => {
  const amount = 10_000_000n;
  const price = priceFromDiscount(amount, 3);
  assert.equal(price, 9_700_000n);
  assert.equal(formatRupiah(price), "Rp9.700.000");
  assert.equal(formatRupiah(profitOf(amount, price), { sign: true }), "+Rp300.000");

  const pct = returnPercent(amount, price);
  assert.equal(formatPercent(pct), "3,09%");

  const yearly = annualizedReturn(pct, 30);
  assert.ok(yearly !== null);
  assert.equal(formatPercent(yearly, 1), "37,6%");
});

test("price rounds down to whole rupiah and handles 0,5% steps", () => {
  assert.equal(priceFromDiscount(10_000_000n, 2.5), 9_750_000n);
  assert.equal(priceFromDiscount(333_333n, 3), 323_333n); // 323.333,01 → 323.333
  assert.equal(priceFromDiscount(10_000_000n, 10), 9_000_000n);
});

test("Rupiah, numbers and percents use id-ID formatting", () => {
  assert.equal(formatRupiah(10_000_000n), "Rp10.000.000");
  assert.equal(formatRupiah(100_000), "Rp100.000");
  assert.equal(formatRupiah(0n), "Rp0");
  assert.equal(formatRupiah(-300_000n), "-Rp300.000");
  assert.equal(formatRupiah(10_000_000_000n), "Rp10.000.000.000");
  assert.equal(formatNumber(100_000_000n), "100.000.000");
  assert.equal(formatPercent(3), "3%");
  assert.equal(formatPercent(2.5), "2,5%");
  assert.equal(formatJuta(100_000_000n), "Rp100 jt");
  assert.equal(formatJuta(50_000_000), "Rp50 jt");
});

test("due dates are 23:59:59 WIB in unix seconds", () => {
  const due = toDueDateSeconds("2026-11-07");
  assert.equal(due, Date.UTC(2026, 10, 7, 16, 59, 59) / 1000); // 23:59:59 WIB = 16:59:59 UTC
  assert.equal(formatDate(due), "7 Nov 2026");
  assert.equal(formatDateTime(due), "7 Nov 2026, 23:59");
  assert.equal(toWibDateString(due), "2026-11-07");
  assert.equal(formatDate(toDueDateSeconds("2026-09-15")), "15 Sep 2026");
  assert.throws(() => toDueDateSeconds("7/11/2026"));
});

test("days to due count WIB calendar days", () => {
  // 8 Oct 2026, 10:00 WIB
  const now = Date.UTC(2026, 9, 8, 3, 0, 0) / 1000;
  const due = dueDateInDays(30, now);
  assert.equal(formatDate(due), "7 Nov 2026");
  assert.equal(daysToDue(due, now), 30);
  assert.equal(formatDue(due, now), "in 30 days");

  // 8 Oct 2026, 23:30 WIB is still the same WIB day as 10:00
  const lateEvening = Date.UTC(2026, 9, 8, 16, 30, 0) / 1000;
  assert.equal(daysToDue(due, lateEvening), 30);

  assert.equal(formatDue(dueDateInDays(1, now), now), "in 1 day");
  assert.equal(formatDue(dueDateInDays(0, now), now), "due today");
  assert.equal(formatDue(dueDateInDays(-1, now), now), "Overdue 1 day");
  assert.equal(formatDue(dueDateInDays(-3, now), now), "Overdue 3 days");
  assert.equal(annualizedReturn(3, 0), null);
});

test("relative times and short addresses", () => {
  const now = 1_800_000_000;
  assert.equal(formatTimeAgo(now - 30, now), "just now");
  assert.equal(formatTimeAgo(now - 5 * 60, now), "5 min ago");
  assert.equal(formatTimeAgo(now - 2 * 3_600, now), "2 h ago");
  assert.equal(formatTimeAgo(now - 3 * 86_400, now), "3 days ago");
  assert.equal(shortAddress("0x1234567890abcdef1234567890abcdef123456ab"), "0x12…ab");
});
