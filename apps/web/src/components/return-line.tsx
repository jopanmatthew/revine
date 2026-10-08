import { annualizedReturn, daysToDue, formatPercent, formatRupiah, nowSeconds, profitOf, returnPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/** "+Rp300.000 · 3,09%" with "≈37,6% per year, if repaid on time" (PRD §7, §9.9). */
export function ReturnLine({
  faceAmount,
  price,
  dueDate,
  now = nowSeconds(),
  className,
}: {
  faceAmount: bigint;
  price: bigint;
  dueDate: number;
  now?: number;
  className?: string;
}) {
  const pct = returnPercent(faceAmount, price);
  const yearly = annualizedReturn(pct, daysToDue(dueDate, now));

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-lg bg-brand-700/[0.07] px-3.5 py-2.5",
        className,
      )}
    >
      <span className="font-bold text-brand-700 tabular-nums">
        {formatRupiah(profitOf(faceAmount, price), { sign: true })} · {formatPercent(pct)}
      </span>
      {yearly !== null && (
        <span className="text-xs text-ink-muted">≈{formatPercent(yearly, 1)} per year, if repaid on time</span>
      )}
    </div>
  );
}
