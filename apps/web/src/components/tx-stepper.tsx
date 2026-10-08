"use client";

import { CheckCircle2Icon, CircleIcon, ExternalLinkIcon, Loader2Icon, MinusCircleIcon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { etherscanTxUrl } from "@/lib/config";
import { isNeutralError, MESSAGES } from "@/lib/messages";
import type { OnStep, TxStep } from "@/lib/types";
import { cn } from "@/lib/utils";

// One shared progress view for every on-chain action (PRD §9.1). Each step shows waiting, in
// progress, done or failed; an Etherscan link appears once there's a hash; on failure it shows the
// §11 message and [Try again], and it never closes by itself on an error.

type StepId = Exclude<TxStep, "error">;

export interface TxStepConfig {
  id: StepId;
  label: string;
}

const DEFAULT_LABELS: Record<StepId, string> = {
  "verify-wallet": "Verify your wallet",
  proving: "Create privacy proof",
  "saving-details": "Save private details",
  approving: "Allow revine. to use mIDR",
  wallet: "Confirm in your wallet",
  pending: "Waiting for Sepolia",
  success: "Done",
};

/**
 * Builds the step list for an action, e.g.
 * txSteps(["approving", "wallet", "pending", "success"], { approving: "Allow revine. to use Rp9.700.000" })
 */
export function txSteps(ids: StepId[], labels: Partial<Record<StepId, string>> = {}): TxStepConfig[] {
  return ids.map((id) => ({ id, label: labels[id] ?? DEFAULT_LABELS[id] }));
}

// After this long on one step, show the matching "this can take a while" note (§11).
const SLOW_AFTER_MS: Partial<Record<StepId, number>> = { proving: 10_000, pending: 60_000 };
const SLOW_NOTES: Partial<Record<StepId, string>> = { proving: MESSAGES.proofSlow, pending: MESSAGES.slowTx };

type FlowStatus = "idle" | "running" | "success" | "error";

interface FlowState {
  open: boolean;
  status: FlowStatus;
  current: StepId | null; // last step reported
  reached: StepId[]; // every step reported so far
  hash?: `0x${string}`;
  error?: string;
  slow: boolean; // current step is taking longer than usual
}

const INITIAL: FlowState = { open: false, status: "idle", current: null, reached: [], slow: false };

export interface TxFlow extends FlowState {
  /** Opens the stepper and runs an action from useRevineActions(). Resolves to undefined on failure. */
  run: <T>(action: (onStep: OnStep) => Promise<T>) => Promise<T | undefined>;
  retry: () => void;
  close: () => void;
}

export function useTxFlow(): TxFlow {
  const [state, setState] = useState<FlowState>(INITIAL);
  const lastAction = useRef<((onStep: OnStep) => Promise<unknown>) | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(slowTimer.current), []);

  const run = useCallback(async <T,>(action: (onStep: OnStep) => Promise<T>): Promise<T | undefined> => {
    lastAction.current = action;
    clearTimeout(slowTimer.current);
    setState({ ...INITIAL, open: true, status: "running" });

    const onStep: OnStep = (step, info) => {
      clearTimeout(slowTimer.current);
      if (step === "error") {
        setState((s) => ({ ...s, status: "error", error: info?.error ?? MESSAGES.generic, slow: false }));
        return;
      }
      const slowAfter = SLOW_AFTER_MS[step];
      if (slowAfter) slowTimer.current = setTimeout(() => setState((s) => ({ ...s, slow: true })), slowAfter);
      setState((s) => ({
        ...s,
        status: step === "success" ? "success" : "running",
        current: step,
        reached: [...s.reached, step],
        hash: info?.hash ?? s.hash,
        slow: false,
      }));
    };

    try {
      return await action(onStep);
    } catch (error) {
      // Actions report their own §11 message; this only catches ones that threw without it.
      setState((s) =>
        s.status === "error" ? s : { ...s, status: "error", error: error instanceof Error ? error.message : MESSAGES.generic },
      );
      return undefined;
    }
  }, []);

  const retry = useCallback(() => {
    if (lastAction.current) void run(lastAction.current);
  }, [run]);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  return { ...state, run, retry, close };
}

type StepState = "waiting" | "active" | "done" | "failed" | "skipped";

function stepStates(flow: FlowState, steps: TxStepConfig[]): StepState[] {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === flow.current));
  return steps.map((step, i) => {
    const reached = flow.reached.includes(step.id);
    if (flow.status === "success") return reached ? "done" : "skipped";
    if (i < currentIndex) return reached ? "done" : "skipped";
    if (i === currentIndex) return flow.status === "error" ? "failed" : flow.status === "running" ? "active" : "waiting";
    return "waiting";
  });
}

function StepIcon({ state, neutral }: { state: StepState; neutral: boolean }) {
  const className = "size-5 shrink-0";
  switch (state) {
    case "active":
      return <Loader2Icon className={cn(className, "animate-spin text-brand-700")} />;
    case "done":
      return <CheckCircle2Icon className={cn(className, "text-brand-700")} />;
    case "failed":
      return <XCircleIcon className={cn(className, neutral ? "text-ink-muted" : "text-danger")} />;
    case "skipped":
      return <MinusCircleIcon className={cn(className, "text-ink-muted/60")} />;
    default:
      return <CircleIcon className={cn(className, "text-ink-muted/40")} />;
  }
}

export function TxStepper({
  flow,
  title,
  description,
  steps,
  successAction,
}: {
  flow: TxFlow;
  title: string;
  description?: string;
  steps: TxStepConfig[];
  successAction?: ReactNode; // e.g. [View invoice]
}) {
  const running = flow.status === "running";
  const neutral = !!flow.error && isNeutralError(flow.error);
  const states = stepStates(flow, steps);

  return (
    <Sheet open={flow.open} onOpenChange={(open) => !open && !running && flow.close()}>
      <SheetContent showCloseButton={!running} className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <ol className="flex flex-col gap-4 px-4" aria-live="polite">
          {steps.map((step, i) => (
            <li key={step.id} className="flex items-start gap-3" data-state={states[i]}>
              <StepIcon state={states[i]} neutral={neutral} />
              <div className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-sm",
                    states[i] === "waiting" || states[i] === "skipped" ? "text-ink-muted" : "font-medium text-ink",
                  )}
                >
                  {step.label}
                </span>
                {states[i] === "skipped" && <span className="text-xs text-ink-muted">Not needed</span>}
                {states[i] === "active" && flow.slow && SLOW_NOTES[step.id] && (
                  <span className="text-xs text-warning-foreground">{SLOW_NOTES[step.id]}</span>
                )}
              </div>
            </li>
          ))}
        </ol>

        {flow.error && (
          <p
            role="alert"
            className={cn(
              "mx-4 rounded-lg px-3 py-2.5 text-sm",
              neutral ? "bg-muted text-ink" : "bg-danger/10 text-danger",
            )}
          >
            {flow.error}
          </p>
        )}

        {flow.hash && (
          <a
            href={etherscanTxUrl(flow.hash)}
            target="_blank"
            rel="noreferrer"
            className="mx-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            View on Etherscan
            <ExternalLinkIcon className="size-3.5" />
          </a>
        )}

        {!running && (
          <SheetFooter>
            {flow.status === "error" && (
              <Button size="lg" className="h-11" onClick={flow.retry}>
                Try again
              </Button>
            )}
            {flow.status === "success" && successAction}
            <Button size="lg" variant="outline" className="h-11" onClick={flow.close}>
              {flow.status === "success" ? "Done" : "Close"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
