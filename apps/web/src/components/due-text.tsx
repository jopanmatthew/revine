import { ClockAlertIcon } from "lucide-react";

import { formatDate, formatDue, nowSeconds } from "@/lib/format";
import { cn } from "@/lib/utils";

/** "in 28 days · 7 Nov 2026", or an amber "Overdue 3 days" tag once the due date has passed. */
export function DueText({
  dueDate,
  showDate = true,
  now = nowSeconds(),
  className,
}: {
  dueDate: number;
  showDate?: boolean;
  now?: number;
  className?: string;
}) {
  if (now > dueDate) {
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-xs font-medium whitespace-nowrap text-warning-foreground",
          className,
        )}
      >
        <ClockAlertIcon className="size-3.5" aria-hidden />
        {formatDue(dueDate, now)}
      </span>
    );
  }
  return (
    <span className={cn("text-xs whitespace-nowrap text-ink-muted tabular-nums", className)}>
      {formatDue(dueDate, now)}
      {showDate && ` · ${formatDate(dueDate)}`}
    </span>
  );
}
