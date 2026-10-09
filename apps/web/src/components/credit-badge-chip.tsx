"use client";

import { ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BADGE_VALIDITY_SECONDS, USE_MOCKS, ZK_PROOFS_ENABLED } from "@/lib/config";
import { useCreditBadge } from "@/lib/hooks";
import { formatDate, formatJuta } from "@/lib/format";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A seller's ZK credit badge (PRD §9.7, P1): "✓ Revenue above Rp100 jt". Financiers see the tier,
 * never the revenue. Without a valid badge it shows "No credit badge" (or nothing, with hideIfNone).
 */
export function CreditBadgeChip({
  address,
  hideIfNone = false,
  tone = "light",
  className,
}: {
  address?: Address;
  hideIfNone?: boolean;
  tone?: "light" | "dark"; // dark: on the brand-900 cover band
  className?: string;
}) {
  const { badge, isLoading } = useCreditBadge(address);

  if (isLoading) return <Skeleton className={cn("h-5 w-36 rounded-4xl", tone === "dark" && "bg-white/10", className)} />;

  if (!badge?.isValid) {
    if (hideIfNone) return null;
    return (
      <Badge
        variant="outline"
        className={cn(tone === "dark" ? "border-white/20 text-white/70" : "text-ink-muted", className)}
      >
        No credit badge
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className={cn(
            tone === "dark" ? "border-mint/30 bg-mint/15 text-mint" : "border-brand-700/20 bg-brand-700/10 text-brand-700",
            className,
          )}
          tabIndex={0}
        >
          <ShieldCheckIcon data-icon="inline-start" />
          {USE_MOCKS ? "Demo · " : !ZK_PROOFS_ENABLED ? "Test verifier · " : ""}Revenue above {formatJuta(badge.threshold)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {USE_MOCKS
          ? "Simulated demo badge; no proof has been verified on-chain."
          : ZK_PROOFS_ENABLED
            ? `Last 6 months · ZK-verified · valid until ${formatDate(badge.attestedAt + BADGE_VALIDITY_SECONDS)}`
            : "Test-only verifier; this badge is not backed by a ZK proof."}
      </TooltipContent>
    </Tooltip>
  );
}
