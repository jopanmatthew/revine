"use client";

import { CheckCircle2Icon, CircleIcon, ExternalLinkIcon, Loader2Icon, MinusCircleIcon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ActionSheet } from "@/components/action-sheet";
import { Button } from "@/components/ui/button";
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

export type TxResult<T> = { ok: true; value: T } | { ok: false };

export interface TxFlow extends FlowState {
  /** Opens the stepper and runs an action from useRevineActions(). */
  run: <T>(action: (onStep: OnStep) => Promise<T>) => Promise<TxResult<T>>;
  retry: () => void;
  close: () => void;
}

export function useTxFlow(): TxFlow {
  const [state, setState] = useState<FlowState>(INITIAL);
  const lastAction = useRef<((onStep: OnStep) => Promise<unknown>) | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(slowTimer.current), []);

  const run = useCallback(async <T,>(action: (onStep: OnStep) => Promise<T>): Promise<TxResult<T>> => {
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
      return { ok: true, value: await action(onStep) };
    } catch (error) {
      // Actions report their own §11 message; this only catches ones that threw without it.
      setState((s) =>
        s.status === "error" ? s : { ...s, status: "error", error: error instanceof Error ? error.message : MESSAGES.generic },
      );
      return { ok: false };
    }
  }, []);

  const retry = useCallback(() => {
    if (lastAction.current) void run(lastAction.current);
  }, [run]);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  return { ...state, run, retry, close };
}

export interface TxConfig {
  title: string;
  description?: string;
  steps: TxStepConfig[];
  successAction?: ReactNode;
  failureAction?: (error: string) => ReactNode;
}

/** One stepper per screen: start(config, action) opens it for whichever action the user picked. */
export function useTxRunner() {
  const flow = useTxFlow();
  const [config, setConfig] = useState<TxConfig | null>(null);
  const { run } = flow;

  const start = useCallback(
    <T,>(next: TxConfig, action: (onStep: OnStep) => Promise<T>) => {
      setConfig(next);
      return run(action);
    },
    [run],
  );

  const stepper = config ? <TxStepper flow={flow} {...config} /> : null;
  return { start, stepper, flow };
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
  failureAction,
}: {
  flow: TxFlow;
  title: string;
  description?: string;
  steps: TxStepConfig[];
  successAction?: ReactNode; // e.g. [View invoice]
  failureAction?: (error: string) => ReactNode; // replaces [Try again] when it returns something
}) {
  const running = flow.status === "running";
  const neutral = !!flow.error && isNeutralError(flow.error);
  const states = stepStates(flow, steps);
  const customFailure = flow.error ? failureAction?.(flow.error) : null;

  return (
    <ActionSheet
      open={flow.open}
      onOpenChange={(open) => !open && flow.close()}
      dismissible={!running}
      title={title}
      description={description}
      footer={
        !running && (
          <>
            {flow.status === "error" &&
              (customFailure ?? (
                <Button size="lg" className="h-11" onClick={flow.retry}>
                  Try again
                </Button>
              ))}
            {flow.status === "success" && successAction}
            <Button size="lg" variant="outline" className="h-11" onClick={flow.close}>
              {flow.status === "success" ? "Done" : "Close"}
            </Button>
          </>
        )
      }
    >
      <ol className="flex flex-col gap-4" aria-live="polite">
        {steps.map((step, i) => {
          const state = states[i];
          const finale = step.id === "success" && state === "done";
          return (
            <li key={step.id} className="flex items-start gap-3" data-state={state}>
              <span
                className={cn(
                  "flex",
                  finale && "animate-in duration-300 ease-(--ease-out) fade-in-0 zoom-in-75 motion-reduce:zoom-in-100",
                )}
              >
                <StepIcon state={state} neutral={neutral} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span
                  data-step-label
                  className={cn(
                    "text-sm",
                    state === "waiting" || state === "skipped" ? "text-ink-muted" : "font-medium text-ink",
                    finale && "text-base font-bold text-brand-900",
                  )}
                >
                  {step.label}
                </span>
                {state === "skipped" && <span className="text-xs text-ink-muted">Not needed</span>}
                {state === "active" && flow.slow && SLOW_NOTES[step.id] && (
                  <span className="text-xs text-warning-foreground">{SLOW_NOTES[step.id]}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {flow.error && (
        <p
          role="alert"
          className={cn("rounded-lg px-3 py-2.5 text-sm", neutral ? "bg-muted text-ink" : "bg-danger/10 text-danger")}
        >
          {flow.error}
        </p>
      )}

      {flow.hash && (
        <a
          href={etherscanTxUrl(flow.hash)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          View on Etherscan
          <ExternalLinkIcon className="size-3.5" />
        </a>
      )}
    </ActionSheet>
  );
}
