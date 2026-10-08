"use client";

import { XIcon } from "lucide-react";
import { toast } from "sonner";

import { RupiahAmount } from "@/components/rupiah-amount";

/**
 * The one "you got paid" moment (PRD §1, §9.1): a headless Sonner toast so it can carry the amount
 * at full size, in the brand's dark green, while keeping Sonner's stacking and swipe-to-dismiss.
 * The visible text is still exactly "You got paid Rp9.700.000 🎉".
 */
export function showPaidToast({ id, amount, detail }: { id: string; amount: bigint; detail: string }) {
  toast.custom(
    (t) => (
      <div
        role="status"
        className="relative flex w-[min(24rem,calc(100vw-2rem))] items-start gap-4 overflow-hidden rounded-2xl bg-brand-900 px-5 py-4 text-white shadow-[0_24px_48px_-20px_rgb(11_31_26/0.75)] ring-1 ring-white/10"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-4">
          <p className="flex flex-col text-sm font-medium text-white/80">
            You got paid{" "}
            <span className="flex items-center gap-2 text-[1.75rem] leading-tight font-bold tracking-tight text-white">
              <RupiahAmount value={amount} /> 🎉
            </span>
          </p>
          <p className="text-sm text-white/70">{detail}</p>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          aria-label="Dismiss"
          className="absolute top-2 right-2 rounded-md p-1 text-white/50 transition-colors hover:text-white"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    ),
    { id, duration: 10_000 },
  );
}
