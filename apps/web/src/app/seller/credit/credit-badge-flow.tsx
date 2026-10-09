"use client";

import { ArrowLeftIcon, CheckIcon, LandmarkIcon, LockIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { BadgeCredential } from "@/components/badge-credential";
import { Cover } from "@/components/cover";
import { PageContainer, panelClass } from "@/components/page";
import { RupiahAmount } from "@/components/rupiah-amount";
import { txSteps, useTxRunner } from "@/components/tx-stepper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletGate } from "@/components/wallet-gate";
import { BADGE_VALIDITY_SECONDS, USE_MOCKS } from "@/lib/config";
import { formatDateTime, formatJuta, nowSeconds, SECONDS_PER_DAY } from "@/lib/format";
import { useCreditBadge, useRevineActions, useWallet } from "@/lib/hooks";
import { MESSAGES } from "@/lib/messages";
import type { Attestation } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIERS = [50_000_000n, 100_000_000n, 250_000_000n, 500_000_000n];

export function CreditBadgeFlow() {
  return (
    <WalletGate>
      <CreditBadgeSteps />
    </WalletGate>
  );
}

function CreditBadgeSteps() {
  const { address, isWrongNetwork } = useWallet();
  const { badge, isLoading: badgeLoading } = useCreditBadge(address);
  const actions = useRevineActions();
  const { start, stepper } = useTxRunner();
  const [attesting, setAttesting] = useState(false);
  const [attestError, setAttestError] = useState<string | null>(null);
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [tier, setTier] = useState<bigint | null>(null);
  const [published, setPublished] = useState<{ threshold: bigint; attestedAt: number } | null>(null);
  const now = nowSeconds();

  const existing = badge && badge.verifiedAt > 0 ? badge : null;
  const daysLeft = existing ? Math.floor((existing.attestedAt + BADGE_VALIDITY_SECONDS - now) / SECONDS_PER_DAY) : null;
  const qualifying = attestation ? TIERS.filter((t) => BigInt(attestation.revenue) >= t) : [];
  const chosen = tier ?? qualifying.at(-1) ?? null;

  async function connectBank() {
    setAttesting(true);
    setAttestError(null);
    try {
      const result = await actions.getAttestation();
      setAttestation(result);
      setTier(null);
    } catch {
      setAttestError(MESSAGES.attesterUnavailable);
    } finally {
      setAttesting(false);
    }
  }

  async function publish() {
    if (!attestation || chosen === null) return;
    if (nowSeconds() - attestation.attestedAt > BADGE_VALIDITY_SECONDS) {
      setAttestError(MESSAGES.attestationTooOld);
      setAttestation(null);
      return;
    }
    const result = await start(
      {
        title: USE_MOCKS ? "Simulate your credit badge" : "Publish your credit badge",
        steps: txSteps(["proving", "wallet", "pending", "success"], {
          proving: USE_MOCKS ? "Simulate demo badge" : "Create privacy proof (in this browser)",
        }),
      },
      (onStep) => actions.publishCreditBadge(chosen, attestation, onStep),
    );
    if (result.ok) {
      setPublished({ threshold: chosen, attestedAt: attestation.attestedAt });
      setAttestation(null);
    }
  }

  // No badge or an expired one: the steps show straight away. A badge close to expiry refreshes on request.
  const showFlow = !published && (!existing || !existing.isValid || !!attestation);

  return (
    <>
      <Cover
        title={
          <>
            Credit <strong>badge</strong>
          </>
        }
        lede="Show financiers your business is healthy, without showing your numbers."
      >
        <Link
          href="/seller"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Dashboard
        </Link>
      </Cover>
      <PageContainer overlap>
        <div className={cn(panelClass, "flex w-full max-w-3xl flex-col gap-8 px-5 py-6 sm:px-8 sm:py-8")}>
        {badgeLoading ? (
          <Skeleton className="h-36 rounded-3xl" />
        ) : published ? (
          <Result threshold={published.threshold} attestedAt={published.attestedAt} />
        ) : (
          existing && (
            <div className="flex flex-col gap-3">
              <BadgeCredential threshold={existing.threshold} attestedAt={existing.attestedAt} />
              {!existing.isValid ? (
                <p className="rounded-lg bg-warning px-3.5 py-3 text-sm font-medium text-warning-foreground">
                  {MESSAGES.badgeExpired}
                </p>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-muted">
                    {daysLeft !== null && daysLeft < 7
                      ? `Your badge expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}.`
                      : "Financiers see this badge. Your exact revenue never goes on-chain."}
                  </p>
                  {daysLeft !== null && daysLeft < 7 && !attestation && (
                    <Button variant="outline" className="h-11 bg-card sm:h-9" onClick={connectBank} disabled={attesting}>
                      <RefreshCwIcon data-icon="inline-start" />
                      {attesting ? "Connecting…" : "Refresh badge"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {!badgeLoading && showFlow && (
          <ol className="flex flex-col">
            <Step n={1} title="Get your revenue attested" done={!!attestation} last={false}>
              {attestation ? (
                <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 px-4 py-4 ring-1 ring-foreground/[0.06] sm:px-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <LandmarkIcon className="size-4 text-brand-700" aria-hidden />
                    Demo Bank
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-ink-muted">Revenue, last 6 months</span>
                    <RupiahAmount value={attestation.revenue} className="text-3xl font-bold tracking-tight" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1 font-medium text-brand-700">
                      <LockIcon className="size-3.5" aria-hidden />
                      Only you can see this
                    </span>
                    <span>Attested {formatDateTime(attestation.attestedAt)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-pretty text-ink-muted">
                    The demo bank signs your last 6 months of revenue. It stands in for a real bank or accounting
                    system, and it only signs its own numbers.
                  </p>
                  <Button className="h-12 w-full text-base sm:w-fit sm:px-6" onClick={connectBank} disabled={attesting}>
                    <LandmarkIcon data-icon="inline-start" />
                    {attesting ? "Connecting…" : "Connect demo bank"}
                  </Button>
                  {attestError && (
                    <p role="alert" className="rounded-lg bg-danger/10 px-3.5 py-3 text-sm text-danger">
                      {attestError}
                    </p>
                  )}
                </div>
              )}
            </Step>

            <Step n={2} title="Pick what to prove" done={!!attestation && chosen !== null} disabled={!attestation} last={false}>
              {attestation && (
                <div role="radiogroup" aria-label="Revenue tier" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TIERS.map((t) => {
                    const reachable = BigInt(attestation.revenue) >= t;
                    const checked = chosen === t;
                    return (
                      <button
                        key={t.toString()}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        disabled={!reachable}
                        onClick={() => setTier(t)}
                        className={cn(
                          "flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-2xl px-3.5 py-3 text-left ring-1 transition-[box-shadow,background-color] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          checked ? "bg-brand-700/[0.07] ring-2 ring-brand-700" : "bg-card ring-foreground/10",
                          !reachable && "cursor-not-allowed bg-muted/60 ring-foreground/5",
                        )}
                      >
                        <span className={cn("text-base font-bold", reachable ? "text-ink" : "text-ink-muted")}>
                          {formatJuta(t)}+
                        </span>
                        {!reachable && <span className="text-[0.6875rem] leading-tight text-ink-muted">{MESSAGES.tierTooHigh}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </Step>

            <Step n={3} title={USE_MOCKS ? "Simulate demo badge" : "Create proof & publish badge"} done={false} disabled={!attestation} last>
              {attestation && chosen !== null && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-pretty text-ink-muted">
                    {USE_MOCKS
                      ? "This prototype simulates the bank and badge flow. It creates no cryptographic proof and sends no on-chain transaction."
                      : `Your browser creates a privacy proof that your revenue is above ${formatJuta(chosen)}. Only the proof goes on-chain, never the number.`}
                  </p>
                  <Button className="h-12 w-full text-base sm:w-fit sm:px-6" disabled={isWrongNetwork} onClick={publish}>
                    {USE_MOCKS ? "Simulate demo badge" : "Create proof & publish badge"}
                  </Button>
                </div>
              )}
            </Step>
          </ol>
        )}
        </div>
      </PageContainer>
      {stepper}
    </>
  );
}

function Step({
  n,
  title,
  done,
  disabled,
  last,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  disabled?: boolean;
  last: boolean;
  children?: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
            done ? "bg-brand-700 text-white" : disabled ? "bg-muted text-ink-muted" : "bg-brand-900 text-white",
          )}
        >
          {done ? <CheckIcon className="size-4" aria-label="Done" /> : n}
        </span>
        {!last && <span aria-hidden className={cn("w-px flex-1", done ? "bg-brand-700/50" : "bg-foreground/10")} />}
      </div>
      <div className={cn("flex flex-col gap-3 pt-1", last ? "pb-0" : "pb-8")}>
        <h2 className={cn("text-xl font-bold tracking-tight", disabled ? "text-ink-muted" : "text-ink")}>{title}</h2>
        {children}
      </div>
    </li>
  );
}

function Result({ threshold, attestedAt }: { threshold: bigint; attestedAt: number }) {
  return (
    <div className="flex flex-col gap-4">
      <BadgeCredential
        threshold={threshold}
        attestedAt={attestedAt}
        className="animate-in duration-300 ease-(--ease-out) fade-in-0 slide-in-from-bottom-2 motion-reduce:slide-in-from-bottom-0"
      />
      <p className="text-base text-pretty text-ink">
        {USE_MOCKS
          ? "This sample badge is stored in the local demo only; no credit proof or on-chain badge was created."
          : "Financiers see this badge. Your exact revenue never goes on-chain."}
      </p>
      <Button asChild size="lg" className="h-11 w-full sm:w-fit sm:px-5">
        <Link href="/seller">Back to dashboard</Link>
      </Button>
    </div>
  );
}
