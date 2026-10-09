"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  LockIcon,
  MessageCircleIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Cover } from "@/components/cover";
import { PageContainer, panelClass, StickyAction } from "@/components/page";
import { RupiahAmount } from "@/components/rupiah-amount";
import { SegmentedControl } from "@/components/segmented-control";
import { txSteps, useTxRunner } from "@/components/tx-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletGate } from "@/components/wallet-gate";
import { DEMO_MODE, ZK_PROOFS_ENABLED } from "@/lib/config";
import { sameAddress } from "@/lib/demo-names";
import { daysToDue, dueDateInDays, formatDate, nowSeconds, toDueDateSeconds, toWibDateString } from "@/lib/format";
import { useRevineActions, useWallet } from "@/lib/hooks";
import { useDisplayNameLookup } from "@/lib/profile-names";
import { MESSAGES } from "@/lib/messages";
import { DEMO_INVOICE } from "@/lib/mock";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_ITEMS = 5;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const DUE_CHIPS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
] as const;

/** "15.000" or "15000" → 15000; anything else → NaN. */
function parseWhole(value: string): number {
  const digits = value.replace(/\./g, "").trim();
  return /^\d+$/.test(digits) ? Number(digits) : Number.NaN;
}

function lineTotal(item: { qty: string; unitPrice: string }): number {
  const qty = parseWhole(item.qty);
  const price = parseWhole(item.unitPrice);
  return Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0;
}

function buildSchema(me: string | undefined) {
  const item = z.object({
    name: z.string().trim().min(1, MESSAGES.itemNameEmpty).max(60),
    qty: z.string().refine((v) => {
      const n = parseWhole(v);
      return Number.isInteger(n) && n >= 1 && n <= 1_000_000;
    }, MESSAGES.qtyInvalid),
    unitPrice: z.string().refine((v) => {
      const n = parseWhole(v);
      return Number.isInteger(n) && n >= 1 && n <= 10_000_000_000;
    }, MESSAGES.unitPriceInvalid),
  });

  return z
    .object({
      buyer: z
        .string()
        .trim()
        .regex(ADDRESS, MESSAGES.buyerInvalid)
        .refine((v) => !sameAddress(v, me), MESSAGES.buyerIsSelf),
      items: z.array(item).min(1).max(MAX_ITEMS),
      dueDate: z
        .string()
        .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && daysToDue(toDueDateSeconds(v)) >= 1, MESSAGES.dueDateTooSoon)
        .refine((v) => !/^\d{4}-\d{2}-\d{2}$/.test(v) || daysToDue(toDueDateSeconds(v)) <= 365, MESSAGES.dueDateTooFar),
      description: z.string().max(280),
    })
    .superRefine((values, ctx) => {
      const total = values.items.reduce((sum, i) => sum + lineTotal(i), 0);
      if (values.items.every((i) => Number.isFinite(parseWhole(i.qty)) && Number.isFinite(parseWhole(i.unitPrice)))) {
        if (total < 100_000 || total > 10_000_000_000) {
          ctx.addIssue({ code: "custom", path: ["total"], message: MESSAGES.totalOutOfRange });
        }
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const EMPTY_ITEM = { name: "", qty: "", unitPrice: "" };

export function CreateInvoice() {
  return (
    <WalletGate role="seller">
      <CreateInvoiceForm />
    </WalletGate>
  );
}

function CreateInvoiceForm() {
  const { address, isWrongNetwork } = useWallet();
  const displayName = useDisplayNameLookup();
  const actions = useRevineActions();
  const { start, stepper, flow } = useTxRunner();
  const [created, setCreated] = useState<{ id: bigint; buyer: string } | null>(null);
  const [chip, setChip] = useState<string>("30");
  const schema = useMemo(() => buildSchema(address), [address]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      buyer: "",
      items: [{ ...EMPTY_ITEM }],
      dueDate: toWibDateString(dueDateInDays(30)),
      description: "",
    },
  });
  const { register, control, handleSubmit, setValue, formState } = form;
  const { errors } = formState;
  const items = useFieldArray({ control, name: "items" });
  const watched = useWatch({ control });
  const total = (watched.items ?? []).reduce((sum, i) => sum + lineTotal({ qty: i?.qty ?? "", unitPrice: i?.unitPrice ?? "" }), 0);
  const buyerName = ADDRESS.test(watched.buyer ?? "") ? displayName(watched.buyer) : undefined;
  const dueSeconds = /^\d{4}-\d{2}-\d{2}$/.test(watched.dueDate ?? "") ? toDueDateSeconds(watched.dueDate!) : null;
  const totalError = (errors as { total?: { message?: string } }).total?.message;

  // Leaving mid-transaction would strand the steps: ask the browser to warn.
  const running = flow.status === "running";
  useEffect(() => {
    if (!running) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  function pickChip(days: string) {
    setChip(days);
    setValue("dueDate", toWibDateString(dueDateInDays(Number(days))), { shouldValidate: true });
  }

  function fillDemo() {
    form.reset({
      buyer: DEMO_INVOICE.buyer,
      items: DEMO_INVOICE.items.map((i) => ({ name: i.name, qty: String(i.qty), unitPrice: String(i.unitPrice) })),
      dueDate: toWibDateString(dueDateInDays(DEMO_INVOICE.dueInDays)),
      description: DEMO_INVOICE.description,
    });
    setChip(String(DEMO_INVOICE.dueInDays));
  }

  const submit = handleSubmit(async (values) => {
    const input = {
      buyer: values.buyer.trim() as Address,
      items: values.items.map((i) => ({ name: i.name.trim(), qty: parseWhole(i.qty), unitPrice: parseWhole(i.unitPrice) })),
      dueDate: toDueDateSeconds(values.dueDate),
      description: values.description.trim(),
    };
    const result = await start(
      {
        title: "Create invoice",
        steps: txSteps(
          ZK_PROOFS_ENABLED
            ? ["verify-wallet", "proving", "saving-details", "wallet", "pending", "success"]
            : ["verify-wallet", "saving-details", "wallet", "pending", "success"],
          {
            proving: "Create privacy proof in this browser",
            success: "Invoice created ✓",
          },
        ),
      },
      (onStep) => actions.createInvoice(input, onStep),
    );
    if (result.ok) setCreated({ id: result.value, buyer: input.buyer });
  });

  if (created) {
    return (
      <>
        <Created
          id={created.id}
          buyer={created.buyer}
          onAnother={() => {
            setCreated(null);
            form.reset();
            setChip("30");
          }}
        />
        {stepper}
      </>
    );
  }

  return (
    <>
      <Cover
        title={
          <>
            New <strong>invoice</strong>
          </>
        }
        hero={{
          label: "Invoice total",
          value: <RupiahAmount value={total} />,
          note: "Your buyer confirms it, then you can sell it to a financier and get paid today.",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/seller"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            Dashboard
          </Link>
          {DEMO_MODE && (
            <Button
              variant="outline"
              className="h-10 border-white/25 bg-transparent px-4 text-white hover:bg-white/10 hover:text-white"
              onClick={fillDemo}
            >
              <SparklesIcon data-icon="inline-start" />
              Fill demo invoice
            </Button>
          )}
        </div>
      </Cover>

      <PageContainer overlap>
        <form onSubmit={submit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
          <div className={cn(panelClass, "flex flex-col")}>
            <Section title="Buyer" hint="Who owes you this money.">
              <div className="flex flex-col gap-2">
                <Label htmlFor="buyer">Buyer&apos;s wallet address</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="buyer"
                    placeholder="0x…"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={!!errors.buyer}
                    aria-describedby="buyer-note"
                    className="h-11 bg-card font-mono sm:h-10"
                    {...register("buyer")}
                  />
                  {DEMO_MODE && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 shrink-0 text-brand-700 sm:h-10"
                      onClick={() => setValue("buyer", DEMO_INVOICE.buyer, { shouldValidate: true })}
                    >
                      Use demo buyer
                    </Button>
                  )}
                </div>
                <div id="buyer-note" className="min-h-5 text-sm">
                  {errors.buyer ? (
                    <FieldError>{errors.buyer.message}</FieldError>
                  ) : (
                    buyerName ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-brand-700">
                        <CheckIcon className="size-4" aria-hidden />
                        {buyerName}
                      </span>
                    ) : (
                      <span className="text-ink-muted">Ask your buyer for the wallet address they will use to confirm and pay.</span>
                    )
                  )}
                </div>
              </div>
            </Section>

            <Section title="Items" hint="Up to 5. Names and prices stay private.">
              <ul className="flex flex-col gap-3">
                {items.fields.map((field, index) => {
                  const err = errors.items?.[index];
                  const line = lineTotal({
                    qty: watched.items?.[index]?.qty ?? "",
                    unitPrice: watched.items?.[index]?.unitPrice ?? "",
                  });
                  return (
                    <li
                      key={field.id}
                      className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-2xl bg-muted/50 p-3.5 ring-1 ring-foreground/[0.06] sm:grid-cols-[minmax(0,1fr)_6rem_9rem_auto] sm:items-start sm:bg-transparent sm:p-0 sm:ring-0"
                    >
                      <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
                        <Label htmlFor={`item-${index}-name`} className={cn(index > 0 && "sm:sr-only")}>
                          Item name
                        </Label>
                        <Input
                          id={`item-${index}-name`}
                          maxLength={60}
                          placeholder="Beras premium (kg)"
                          aria-invalid={!!err?.name}
                          className="h-11 bg-card sm:h-10"
                          {...register(`items.${index}.name`)}
                        />
                        {err?.name && <FieldError>{err.name.message}</FieldError>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`item-${index}-qty`} className={cn(index > 0 && "sm:sr-only")}>
                          Qty
                        </Label>
                        <Input
                          id={`item-${index}-qty`}
                          inputMode="numeric"
                          placeholder="500"
                          aria-invalid={!!err?.qty}
                          className="h-11 bg-card text-right tabular-nums sm:h-10"
                          {...register(`items.${index}.qty`)}
                        />
                        {err?.qty && <FieldError>{err.qty.message}</FieldError>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`item-${index}-price`} className={cn(index > 0 && "sm:sr-only")}>
                          Unit price (Rp)
                        </Label>
                        <Input
                          id={`item-${index}-price`}
                          inputMode="numeric"
                          placeholder="15.000"
                          aria-invalid={!!err?.unitPrice}
                          className="h-11 bg-card text-right tabular-nums sm:h-10"
                          {...register(`items.${index}.unitPrice`)}
                        />
                        {err?.unitPrice && <FieldError>{err.unitPrice.message}</FieldError>}
                      </div>
                      <div
                        className={cn(
                          "col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:h-10 sm:justify-end",
                          index === 0 && "sm:mt-[1.375rem]",
                        )}
                      >
                        <RupiahAmount value={line} className="min-w-28 text-right font-medium text-ink" />
                        {items.fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 text-ink-muted hover:text-danger"
                            aria-label={`Remove item ${index + 1}`}
                            onClick={() => items.remove(index)}
                          >
                            <Trash2Icon />
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {items.fields.length < MAX_ITEMS && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-fit bg-card px-5 sm:h-10"
                  onClick={() => items.append({ ...EMPTY_ITEM })}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add item
                </Button>
              )}

              {totalError && <FieldError>{totalError}</FieldError>}
            </Section>

            <Section title="Due date" hint="When your buyer pays the full amount.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SegmentedControl
                  label="Due in"
                  value={chip}
                  onChange={pickChip}
                  options={DUE_CHIPS.map((c) => ({ value: c.value, label: c.label }))}
                  className="max-sm:w-full"
                />
                <Input
                  type="date"
                  aria-label="Pick a due date"
                  min={toWibDateString(dueDateInDays(1))}
                  max={toWibDateString(dueDateInDays(365))}
                  aria-invalid={!!errors.dueDate}
                  className="h-11 w-full bg-card sm:h-10 sm:w-48"
                  {...register("dueDate", { onChange: () => setChip("") })}
                />
              </div>
              {errors.dueDate ? (
                <FieldError>{errors.dueDate.message}</FieldError>
              ) : (
                dueSeconds && (
                  <p className="text-sm text-ink-muted">
                    Due {formatDate(dueSeconds)} at 23:59 WIB · in {daysToDue(dueSeconds, nowSeconds())} days
                  </p>
                )
              )}
            </Section>

            <Section title="Description" hint="Optional.">
              <Label htmlFor="description" className="sr-only">
                Description
              </Label>
              <textarea
                id="description"
                rows={3}
                maxLength={280}
                placeholder="Delivered 8 Oct, PO #0815"
                className="w-full resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                {...register("description")}
              />
              <p className="text-right text-xs text-ink-muted tabular-nums">{(watched.description ?? "").length}/280</p>
            </Section>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            <PublicVsPrivate />
            <div className="max-lg:hidden">
              <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isWrongNetwork || running}>
                Create invoice
              </Button>
            </div>
          </aside>

          <div className="lg:hidden">
            <StickyAction>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col sm:hidden">
                  <span className="text-xs text-ink-muted">Total</span>
                  <RupiahAmount value={total} className="text-lg font-bold" />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6 text-base sm:w-full" disabled={isWrongNetwork || running}>
                  Create invoice
                </Button>
              </div>
            </StickyAction>
          </div>
        </form>
      </PageContainer>

      {stepper}
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-foreground/[0.07] px-5 py-6 last:border-b-0 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
        {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function FieldError({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn("text-sm text-danger", className)}>
      {children}
    </p>
  );
}

/** Explain which invoice details are public and which stay off-chain. */
function PublicVsPrivate() {
  return (
    <div className={panelClass}>
      <div className="flex flex-col gap-2 px-5 py-5 sm:px-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <GlobeIcon className="size-4 text-ink-muted" aria-hidden />
          Public on-chain
        </h2>
        <p className="text-sm text-ink-muted">Amount, due date, seller and buyer addresses, fingerprint.</p>
      </div>
      <div className="flex flex-col gap-2 bg-brand-900 px-5 py-5 text-white sm:px-6">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <LockIcon className="size-4 text-mint" aria-hidden />
          Private
        </h2>
        <p className="text-sm text-white/75">Items, prices, description.</p>
        <p className="text-sm font-medium text-white">Only you and your buyer can see these.</p>
      </div>
    </div>
  );
}

/** Success screen: what happened, what's next, and the share link for the buyer. */
function Created({ id, buyer, onAnother }: { id: bigint; buyer: string; onAnother: () => void }) {
  const displayName = useDisplayNameLookup();
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? `/invoice/${id}` : `${window.location.origin}/invoice/${id}`;
  const share = `https://wa.me/?text=${encodeURIComponent(`Please confirm invoice #${id} on revine.: ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard blocked; the link is still on screen in the WhatsApp message.
    }
  }

  return (
    <>
      <Cover
        title={
          <>
            Invoice <strong>#{id.toString()}</strong> created.
          </>
        }
        lede={`Sent to ${displayName(buyer)} for confirmation. Next: once they confirm, you can get it financed.`}
      />
      <PageContainer overlap className="items-center">
        <div className={cn(panelClass, "flex w-full max-w-lg flex-col items-center gap-6 px-6 py-10 text-center sm:px-10")}>
          <span className="flex size-16 animate-in items-center justify-center rounded-full bg-brand-700/10 text-brand-700 duration-300 ease-(--ease-out) zoom-in-75 fade-in-0 motion-reduce:zoom-in-100">
            <CheckCircle2Icon className="size-9" aria-hidden />
          </span>
          <p className="text-base text-pretty text-ink-muted">
            Share the link so {displayName(buyer)} can check the details and confirm.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Button asChild size="lg" className="h-12 text-base">
              <a href={share} target="_blank" rel="noreferrer">
                <MessageCircleIcon data-icon="inline-start" />
                Share via WhatsApp
              </a>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" className="h-11 bg-card" onClick={copy}>
                {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 bg-card">
                <Link href={`/invoice/${id}`}>View invoice</Link>
              </Button>
            </div>
            <Button asChild variant="ghost" size="lg" className="h-11 text-brand-700">
              <Link href="/seller">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to dashboard
              </Link>
            </Button>
            <Button variant="link" className="text-ink-muted" onClick={onAnother}>
              Create another invoice
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
