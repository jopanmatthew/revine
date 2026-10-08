import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Centered message for empty lists, with an optional action (e.g. [New invoice]). */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="text-ink-muted [&_svg]:size-8">{icon}</div>}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-medium text-ink">{title}</p>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
