"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { shortAddress } from "@/lib/format";
import { useDisplayNameLookup } from "@/lib/profile-names";
import { cn } from "@/lib/utils";

/** A demo name when known, otherwise "0x12…ab" with a copy button (PRD §9.1). */
export function AddressName({ address, className }: { address: string; className?: string }) {
  const name = useDisplayNameLookup()(address);
  const [copied, setCopied] = useState(false);

  if (name !== shortAddress(address)) {
    return (
      <span className={className} title={address}>
        {name}
      </span>
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard blocked; the full address is still in the tooltip.
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-mono text-[0.9em]">{shortAddress(address)}</span>
        </TooltipTrigger>
        <TooltipContent className="font-mono">{address}</TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={copy}
        aria-label={copied ? "Address copied" : "Copy address"}
        className="text-ink-muted"
      >
        {copied ? <CheckIcon className="text-brand-700" /> : <CopyIcon />}
      </Button>
    </span>
  );
}
