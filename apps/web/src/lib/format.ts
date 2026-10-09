// Money, percent, date and return math.
// Numbers use Indonesian formatting: Rp10.000.000, 3,09%. Dates look like "7 Nov 2026".
// Chain times are unix seconds, and due dates are 23:59:59 WIB (UTC+7).
// No imports, so `node --test` can run format.test.ts directly.

export const SECONDS_PER_DAY = 86_400;
const WIB_OFFSET_SECONDS = 7 * 60 * 60;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const integerFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

// ---------------------------------------------------------------------------
// Numbers and money

/** 100000000 → "100.000.000" */
export function formatNumber(value: bigint | number): string {
  return integerFormat.format(value);
}

/** 10000000n → "Rp10.000.000". `sign: true` adds "+" to positive values: "+Rp300.000". */
export function formatRupiah(value: bigint | number, { sign = false }: { sign?: boolean } = {}): string {
  const negative = value < 0;
  const abs = typeof value === "bigint" ? (negative ? -value : value) : Math.abs(value);
  const prefix = negative ? "-" : sign && value > 0 ? "+" : "";
  return `${prefix}Rp${integerFormat.format(abs)}`;
}

/** 50000000 → "Rp50 jt" for credit badge tiers. */
export function formatJuta(value: bigint | number): string {
  const juta = Number(value) / 1_000_000;
  return `Rp${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(juta)} jt`;
}

/** Short form for tight spots: 9999999999 → "Rp10 M", 25400000 → "Rp25,4 jt", 950000 → "Rp950.000". */
export function formatRupiahCompact(value: bigint | number): string {
  const n = Number(value);
  const short = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
  if (Math.abs(n) >= 1_000_000_000) return `Rp${short.format(n / 1_000_000_000)} M`;
  if (Math.abs(n) >= 1_000_000) return `Rp${short.format(n / 1_000_000)} jt`;
  return formatRupiah(value);
}

/** 3.0928 → "3,09%"; 37.63 with 1 digit → "37,6%"; 3 → "3%". */
export function formatPercent(value: number, maximumFractionDigits = 2): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(value)}%`;
}

// ---------------------------------------------------------------------------
// Return math. Discounts are percents (1–10 in 0,5 steps).

/** Price = amount × (1 − discount), rounded down to whole rupiah. 10.000.000 at 3 → 9.700.000. */
export function priceFromDiscount(faceAmount: bigint, discountPercent: number): bigint {
  const basisPoints = BigInt(Math.round(discountPercent * 100));
  return (faceAmount * (10_000n - basisPoints)) / 10_000n;
}

/** Profit = amount − price. */
export function profitOf(faceAmount: bigint, price: bigint): bigint {
  return faceAmount - price;
}

/** Return % = profit ÷ price × 100. 10.000.000 bought at 9.700.000 → 3,0928… */
export function returnPercent(faceAmount: bigint, price: bigint): number {
  if (price <= 0n) return 0;
  return (Number(faceAmount - price) / Number(price)) * 100;
}

/** Annualized ≈ return % × 365 ÷ days to due date. Null when the due date isn't in the future. */
export function annualizedReturn(returnPct: number, daysToDue: number): number | null {
  if (daysToDue <= 0) return null;
  return (returnPct * 365) / daysToDue;
}

// ---------------------------------------------------------------------------
// Dates. Everything is shown and counted in WIB calendar days.

/** Day number (days since 1970-01-01) of the WIB calendar date that contains this instant. */
function wibDay(unixSeconds: number): number {
  return Math.floor((unixSeconds + WIB_OFFSET_SECONDS) / SECONDS_PER_DAY);
}

/** 23:59:59 WIB on the given WIB day number, in unix seconds. */
function endOfWibDay(day: number): number {
  return (day + 1) * SECONDS_PER_DAY - 1 - WIB_OFFSET_SECONDS;
}

/** "2026-11-07" (a date picker value) → 23:59:59 WIB on that date, in unix seconds. */
export function toDueDateSeconds(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Expected a YYYY-MM-DD date, got "${date}"`);
  const [, year, month, day] = match.map(Number);
  return endOfWibDay(Date.UTC(year, month - 1, day) / 1000 / SECONDS_PER_DAY);
}

/** The due date `days` WIB calendar days after today (the "30 days" chip), at 23:59:59 WIB. */
export function dueDateInDays(days: number, now = nowSeconds()): number {
  return endOfWibDay(wibDay(now) + days);
}

/** Unix seconds → "2026-11-07" in WIB, for date inputs. */
export function toWibDateString(unixSeconds: number): string {
  return new Date(wibDay(unixSeconds) * SECONDS_PER_DAY * 1000).toISOString().slice(0, 10);
}

/** Unix seconds → "7 Nov 2026" (WIB). Built by hand because newer ICU prints "Sept". */
export function formatDate(unixSeconds: number): string {
  const d = new Date((unixSeconds + WIB_OFFSET_SECONDS) * 1000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Unix seconds → "7 Nov" (WIB), for the ledger's date column. */
export function formatDayMonth(unixSeconds: number): string {
  const d = new Date((unixSeconds + WIB_OFFSET_SECONDS) * 1000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Unix seconds → "7 Nov 2026, 14:05" (WIB). */
export function formatDateTime(unixSeconds: number): string {
  const d = new Date((unixSeconds + WIB_OFFSET_SECONDS) * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(unixSeconds)}, ${hh}:${mm}`;
}

/** WIB calendar days from today to the due date: 30 = due in 30 days, 0 = due today, −3 = 3 days overdue. */
export function daysToDue(dueDate: number, now = nowSeconds()): number {
  return wibDay(dueDate) - wibDay(now);
}

/** "in 28 days", "in 1 day", "due today", "Overdue 3 days". */
export function formatDue(dueDate: number, now = nowSeconds()): string {
  const days = daysToDue(dueDate, now);
  if (now > dueDate) {
    const late = Math.max(1, -days);
    return `Overdue ${late} ${late === 1 ? "day" : "days"}`;
  }
  if (days === 0) return "due today";
  return `in ${days} ${days === 1 ? "day" : "days"}`;
}

/** Relative time labels such as "just now", "5 min ago", or "sent 2 h ago". */
export function formatTimeAgo(unixSeconds: number, now = nowSeconds()): string {
  const seconds = Math.max(0, now - unixSeconds);
  if (seconds < 60) return "just now";
  if (seconds < 3_600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < SECONDS_PER_DAY) return `${Math.floor(seconds / 3_600)} h ago`;
  const days = Math.floor(seconds / SECONDS_PER_DAY);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

// ---------------------------------------------------------------------------
// Addresses

/** "0x12…ab". */
export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-2)}`;
}
