import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

/** "Rp10.000.000" with tabular figures so Rupiah columns line up (PRD §10.1). */
export function RupiahAmount({
  value,
  sign = false,
  suffix,
  className,
}: {
  value: bigint | number;
  sign?: boolean; // "+Rp300.000"
  suffix?: string; // e.g. "mIDR"
  className?: string;
}) {
  return (
    <span className={cn("whitespace-nowrap tabular-nums", className)}>
      {formatRupiah(value, { sign })}
      {suffix && ` ${suffix}`}
    </span>
  );
}
