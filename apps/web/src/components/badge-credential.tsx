import { ShieldCheckIcon } from "lucide-react";

import { BADGE_VALIDITY_SECONDS, USE_MOCKS, ZK_PROOFS_ENABLED } from "@/lib/config";
import { formatDate, formatJuta } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The credit badge as a credential: the tier, its scope and its expiry, never the revenue.
 * The same object financiers see as a chip on marketplace cards.
 */
export function BadgeCredential({
  threshold,
  attestedAt,
  className,
}: {
  threshold: bigint;
  attestedAt: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-brand-900 px-5 py-5 text-white shadow-[0_18px_40px_-24px_rgb(11_31_26/0.7)] sm:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-mint">
        <ShieldCheckIcon className="size-5" aria-hidden />
        {USE_MOCKS
          ? "Simulated demo badge"
          : ZK_PROOFS_ENABLED
            ? "ZK-verified credit badge"
            : "Test verifier badge"}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">
          Revenue above {formatJuta(threshold)}
        </span>
        <span className="text-sm text-white/70">
          {USE_MOCKS
            ? "Demo data · not verified on-chain"
            : ZK_PROOFS_ENABLED
              ? `last 6 months · ZK-verified · valid until ${formatDate(attestedAt + BADGE_VALIDITY_SECONDS)}`
              : "Test-only verifier · not verified by a ZK proof"}
        </span>
      </div>
    </div>
  );
}
