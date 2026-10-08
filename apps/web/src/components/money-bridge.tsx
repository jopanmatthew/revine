import { daysToDue, formatDate, formatDue, formatRupiah, nowSeconds } from "@/lib/format";
import { cn } from "@/lib/utils";

import { RupiahAmount } from "./rupiah-amount";

// Literal class names so Tailwind generates them: below these container widths the side-by-side
// row hides and the stacked layout shows, and the reverse above them.
const HIDE_ROW = {
  base: "@max-[19.5rem]:hidden",
  long: "@max-[27rem]:hidden",
  lg: "@max-[20rem]:hidden",
  lgLong: "@max-[30rem]:hidden",
} as const;
const HIDE_STACK = {
  base: "@min-[19.5rem]:hidden",
  long: "@min-[27rem]:hidden",
  lg: "@min-[20rem]:hidden",
  lgLong: "@min-[30rem]:hidden",
} as const;

/**
 * revine.'s signature: an invoice as money across time. What you pay now on the left, what you get
 * on the due date on the right, joined by the term. Used on marketplace cards, the buy and get-financed
 * sheets, the portfolio and the landing example.
 */
export function MoneyBridge({
  pay,
  receive,
  dueDate,
  payLabel = "You pay",
  receiveLabel = "You get",
  payNote = "today",
  receiveNote,
  size = "md",
  now = nowSeconds(),
  animated = false,
  className,
}: {
  pay: bigint;
  receive: bigint;
  dueDate: number;
  payLabel?: string;
  receiveLabel?: string;
  payNote?: string;
  receiveNote?: string; // replaces "on 7 Nov 2026", e.g. on a prerendered page
  size?: "sm" | "md" | "lg";
  now?: number;
  animated?: boolean; // draw the term line once on load (the landing example only)
  className?: string;
}) {
  const days = daysToDue(dueDate, now);
  const overdue = now > dueDate;
  // Rp1 miliar and up gets one size smaller so both amounts still fit side by side at 320px.
  const long = receive >= 1_000_000_000n;
  const amountClass = cn(
    "font-bold tracking-tight text-ink",
    size === "sm" && "text-base",
    size === "md" && (long ? "text-base sm:text-lg" : "text-lg sm:text-xl"),
    size === "lg" && (long ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"),
  );
  const term = overdue ? formatDue(dueDate, now) : days === 0 ? "due today" : `in ${days} ${days === 1 ? "day" : "days"}`;

  // Below these container widths the two amounts no longer fit side by side, so the bridge turns
  // vertical: pay on top, the term line running down, get below (break-ui at 320px and Rp10 miliar).
  const fit = size === "lg" ? (long ? "lgLong" : "lg") : long ? "long" : "base";
  const dot = cn("size-1.5 shrink-0 rounded-full", overdue ? "bg-warning-foreground" : "bg-brand-700");
  const termClass = cn("text-[0.6875rem] font-medium whitespace-nowrap", overdue ? "text-warning-foreground" : "text-brand-700");
  const receiveNoteText = receiveNote ?? `on ${formatDate(dueDate)}`;

  return (
    <div className={cn("@container", className)}>
      <p className="sr-only">
        {payLabel} {formatRupiah(pay)} {payNote}. {receiveLabel} {formatRupiah(receive)} {receiveNoteText}, {term}.
      </p>

      <div
        aria-hidden
        className={cn("grid grid-cols-[auto_minmax(2.5rem,1fr)_auto] items-center gap-x-3 gap-y-0.5", HIDE_ROW[fit])}
      >
        <span className="text-xs font-medium text-ink-muted">{payLabel}</span>
        <span className={cn(termClass, "text-center")}>{term}</span>
        <span className="text-right text-xs font-medium text-ink-muted">{receiveLabel}</span>

        <RupiahAmount value={pay} className={amountClass} />
        <span className="flex items-center">
          <span className={dot} />
          <span
            className={cn(
              "h-px flex-1 origin-left",
              overdue
                ? "bg-[repeating-linear-gradient(90deg,var(--warning-foreground)_0_4px,transparent_4px_7px)]"
                : "bg-brand-700/35",
              animated && "motion-safe:animate-[revine-draw_900ms_var(--ease-out)_400ms_both]",
            )}
          />
          <svg
            viewBox="0 0 6 10"
            className={cn(
              "h-2.5 w-1.5 shrink-0",
              overdue ? "text-warning-foreground" : "text-brand-700",
              animated && "motion-safe:animate-[revine-appear_250ms_ease-out_1200ms_both]",
            )}
          >
            <path d="M1 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <RupiahAmount value={receive} className={cn(amountClass, "text-right")} />

        <span className="text-xs text-ink-muted">{payNote}</span>
        <span />
        <span className="text-right text-xs text-ink-muted">{receiveNoteText}</span>
      </div>

      <div aria-hidden className={cn("grid grid-cols-[0.375rem_minmax(0,1fr)_auto] gap-x-3", HIDE_STACK[fit])}>
        <span className={cn(dot, "mt-1.5")} />
        <span className="flex flex-col">
          <span className="text-xs font-medium text-ink-muted">{payLabel}</span>
          <span className="text-xs text-ink-muted">{payNote}</span>
        </span>
        <RupiahAmount value={pay} className={cn(amountClass, "text-right")} />

        <span className="flex justify-center py-1">
          <span
            className={cn(
              "w-px",
              overdue
                ? "bg-[repeating-linear-gradient(180deg,var(--warning-foreground)_0_4px,transparent_4px_7px)]"
                : "bg-brand-700/35",
            )}
          />
        </span>
        <span className={cn(termClass, "col-span-2 py-1.5")}>{term}</span>

        <svg
          viewBox="0 0 10 6"
          className={cn("mt-1.5 h-1.5 w-2.5 justify-self-center", overdue ? "text-warning-foreground" : "text-brand-700")}
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="flex flex-col">
          <span className="text-xs font-medium text-ink-muted">{receiveLabel}</span>
          <span className="text-xs text-ink-muted">{receiveNoteText}</span>
        </span>
        <RupiahAmount value={receive} className={cn(amountClass, "text-right")} />
      </div>
    </div>
  );
}
