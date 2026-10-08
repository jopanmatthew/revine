// Simulated contract for mock mode (PRD §16.3). Each action walks through its steps with about
// 1-second delays and enforces the same rules as RevineInvoice (§13.3), so screens can be built
// against realistic errors. Messages come from §11.
import type { RevineActions } from "@/lib/hooks/use-revine-actions";
import { sameAddress } from "@/lib/demo-names";
import { BADGE_VALIDITY_SECONDS, FAUCET_AMOUNT } from "@/lib/config";
import { nowSeconds, SECONDS_PER_DAY } from "@/lib/format";
import { CONTRACT_ERROR_MESSAGES, MESSAGES, type ContractErrorName } from "@/lib/messages";
import {
  badgeIsValid,
  itemsTotal,
  mockAccountAddress,
  mockRevenue,
  mockStore,
  randomHex,
  type MockBalance,
} from "@/lib/mock";
import type { Address, Invoice, InvoiceStatus, OnStep, TxStep } from "@/lib/types";

const STEP_DELAY_MS = 1_000;
const MAX_AMOUNT = 10_000_000_000;
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockFailure extends Error {}

function contractError(name: ContractErrorName): MockFailure {
  return new MockFailure(CONTRACT_ERROR_MESSAGES[name]);
}

/** Reports a step, then waits so the stepper can show it. */
async function step(onStep: OnStep, name: TxStep, info?: { hash?: `0x${string}` }) {
  onStep(name, info);
  await sleep(STEP_DELAY_MS);
}

/** A wallet prompt (signature, approval or transaction). Honors "Simulate wallet cancel". */
async function walletPrompt(onStep: OnStep, name: TxStep) {
  await step(onStep, name);
  if (mockStore.getState().cancelNextTx) {
    mockStore.update(() => ({ cancelNextTx: false }));
    throw new MockFailure(MESSAGES.userRejected);
  }
}

function requireWallet(): Address {
  const { account, wrongNetwork } = mockStore.getState();
  const address = mockAccountAddress(account);
  if (!address) throw new MockFailure(MESSAGES.notConnected);
  if (wrongNetwork) throw new MockFailure(MESSAGES.wrongNetwork("Ethereum Mainnet"));
  return address;
}

function getInvoice(id: bigint): Invoice {
  const invoice = mockStore.getState().invoices.find((inv) => inv.id === id);
  if (!invoice) throw new MockFailure(MESSAGES.generic);
  return invoice;
}

function expectStatus(invoice: Invoice, allowed: InvoiceStatus[], message?: string) {
  if (!allowed.includes(invoice.status)) {
    throw message ? new MockFailure(message) : contractError("WrongStatus");
  }
}

function balanceOf(address: string): MockBalance {
  return mockStore.getState().balances[address.toLowerCase()] ?? { midr: 0n, eth: 0n };
}

function addMidr(balances: Record<string, MockBalance>, address: string, delta: bigint) {
  const key = address.toLowerCase();
  const current = balances[key] ?? { midr: 0n, eth: 0n };
  return { ...balances, [key]: { ...current, midr: current.midr + delta } };
}

function patchInvoice(id: bigint, patch: Partial<Invoice>) {
  mockStore.update((s) => ({ invoices: s.invoices.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)) }));
}

/**
 * Runs one action: checks (like a contract simulation) before the wallet prompt and again when the
 * transaction "lands", then applies the change. Any failure is reported through onStep('error').
 */
async function runTx<T>(
  onStep: OnStep,
  options: {
    before?: (onStep: OnStep) => Promise<void>; // off-chain steps such as verify-wallet
    approve?: boolean;
    check: () => void;
    apply: () => T;
  },
): Promise<T> {
  try {
    await options.before?.(onStep);
    options.check();
    if (options.approve) await walletPrompt(onStep, "approving");
    await walletPrompt(onStep, "wallet");
    const hash = randomHex();
    await step(onStep, "pending", { hash });
    options.check();
    const result = options.apply();
    onStep("success", { hash });
    return result;
  } catch (error) {
    const message = error instanceof MockFailure ? error.message : MESSAGES.generic;
    onStep("error", { error: message });
    throw new Error(message, { cause: error });
  }
}

export const mockActions: RevineActions = {
  async createInvoice(input, onStep) {
    const amount = itemsTotal(input.items);
    let commitment: `0x${string}` = "0x";

    return runTx(onStep, {
      before: async (report) => {
        const me = requireWallet();
        if (!ADDRESS_PATTERN.test(input.buyer) || sameAddress(input.buyer, me)) throw contractError("InvalidBuyer");
        await walletPrompt(report, "verify-wallet");
        await step(report, "saving-details");
        commitment = randomHex();
        const details = {
          commitment,
          seller: me,
          buyer: input.buyer,
          faceAmount: amount,
          dueDate: input.dueDate,
          items: input.items,
          description: input.description,
          salt: randomHex(31),
        };
        mockStore.update((s) => ({ details: { ...s.details, [commitment]: details } }));
      },
      check: () => {
        const now = nowSeconds();
        if (input.items.length < 1 || input.items.length > 5 || amount <= 0 || amount > MAX_AMOUNT) {
          throw contractError("InvalidAmount");
        }
        if (input.dueDate <= now || input.dueDate > now + 366 * SECONDS_PER_DAY) throw contractError("InvalidDueDate");
      },
      apply: () => {
        const id = BigInt(mockStore.getState().invoices.length + 1); // ids start at 1
        const invoice: Invoice = {
          id,
          seller: requireWallet(),
          buyer: input.buyer,
          holder: null,
          faceAmount: BigInt(amount),
          askPrice: 0n,
          commitment,
          dueDate: input.dueDate,
          createdAt: nowSeconds(),
          respondedAt: 0,
          listedAt: 0,
          financedAt: 0,
          paidAt: 0,
          status: "Created",
        };
        mockStore.update((s) => ({ invoices: [...s.invoices, invoice] }));
        return id;
      },
    });
  },

  async confirmInvoice(id, onStep) {
    await runTx(onStep, {
      check: () => {
        const invoice = getInvoice(id);
        if (!sameAddress(requireWallet(), invoice.buyer)) throw contractError("NotBuyer");
        expectStatus(invoice, ["Created"]);
      },
      apply: () => {
        const invoice = getInvoice(id);
        patchInvoice(id, { status: "Verified", respondedAt: nowSeconds(), holder: invoice.seller });
      },
    });
  },

  async rejectInvoice(id, onStep) {
    await runTx(onStep, {
      check: () => {
        const invoice = getInvoice(id);
        if (!sameAddress(requireWallet(), invoice.buyer)) throw contractError("NotBuyer");
        expectStatus(invoice, ["Created"]);
      },
      apply: () => patchInvoice(id, { status: "Rejected", respondedAt: nowSeconds() }),
    });
  },

  async listInvoice(id, askPrice, onStep) {
    await runTx(onStep, {
      check: () => {
        const invoice = getInvoice(id);
        if (!sameAddress(requireWallet(), invoice.holder)) throw contractError("NotHolder");
        expectStatus(invoice, ["Verified"]);
        if (askPrice <= 0n || askPrice > invoice.faceAmount) throw contractError("InvalidPrice");
        if (nowSeconds() >= invoice.dueDate) throw contractError("PastDue");
      },
      apply: () => patchInvoice(id, { status: "Listed", askPrice, listedAt: nowSeconds() }),
    });
  },

  async unlistInvoice(id, onStep) {
    await runTx(onStep, {
      check: () => {
        const invoice = getInvoice(id);
        if (!sameAddress(requireWallet(), invoice.holder)) throw contractError("NotHolder");
        expectStatus(invoice, ["Listed"]);
      },
      apply: () => patchInvoice(id, { status: "Verified", askPrice: 0n }),
    });
  },

  async buyInvoice(id, onStep) {
    await runTx(onStep, {
      approve: true,
      check: () => {
        const me = requireWallet();
        const invoice = getInvoice(id);
        expectStatus(invoice, ["Listed"], MESSAGES.buyWrongStatus);
        if (nowSeconds() >= invoice.dueDate) throw contractError("PastDue");
        if (sameAddress(me, invoice.holder)) throw contractError("CannotBuyOwn");
        const { midr } = balanceOf(me);
        if (midr < invoice.askPrice) throw new MockFailure(MESSAGES.noMidr(invoice.askPrice, midr));
      },
      apply: () => {
        const me = requireWallet();
        const invoice = getInvoice(id);
        mockStore.update((s) => ({
          balances: addMidr(addMidr(s.balances, me, -invoice.askPrice), invoice.holder ?? invoice.seller, invoice.askPrice),
        }));
        patchInvoice(id, { status: "Financed", financedAt: nowSeconds(), holder: me });
      },
    });
  },

  async repayInvoice(id, onStep) {
    await runTx(onStep, {
      approve: true,
      check: () => {
        const me = requireWallet();
        const invoice = getInvoice(id);
        if (!sameAddress(me, invoice.buyer)) throw contractError("NotBuyer");
        expectStatus(invoice, ["Verified", "Listed", "Financed"]);
        const { midr } = balanceOf(me);
        if (midr < invoice.faceAmount) throw new MockFailure(MESSAGES.noMidr(invoice.faceAmount, midr));
      },
      apply: () => {
        const invoice = getInvoice(id);
        const recipient = invoice.holder ?? invoice.seller;
        mockStore.update((s) => ({
          balances: addMidr(addMidr(s.balances, invoice.buyer, -invoice.faceAmount), recipient, invoice.faceAmount),
        }));
        patchInvoice(id, { status: "Paid", paidAt: nowSeconds() });
      },
    });
  },

  async getAttestation() {
    const me = requireWallet();
    await sleep(STEP_DELAY_MS);
    return { revenue: mockRevenue(me), attestedAt: nowSeconds(), signature: randomHex(64) };
  },

  async publishCreditBadge(threshold, attestation, onStep) {
    await runTx(onStep, {
      before: async (report) => {
        requireWallet();
        if (nowSeconds() - attestation.attestedAt > BADGE_VALIDITY_SECONDS) throw contractError("AttestationExpired");
        await step(report, "proving");
        // The circuit can't prove a tier above the attested revenue.
        if (BigInt(attestation.revenue) < threshold) throw new MockFailure(MESSAGES.proofFailed);
      },
      check: () => {
        if (nowSeconds() - attestation.attestedAt > BADGE_VALIDITY_SECONDS) throw contractError("AttestationExpired");
      },
      apply: () => {
        const me = requireWallet().toLowerCase();
        const badge = { threshold, attestedAt: attestation.attestedAt, verifiedAt: nowSeconds() };
        mockStore.update((s) => ({ badges: { ...s.badges, [me]: { ...badge, isValid: badgeIsValid(badge) } } }));
      },
    });
  },

  async faucet(onStep) {
    await runTx(onStep, {
      check: () => {
        requireWallet();
      },
      apply: () => {
        const me = requireWallet();
        mockStore.update((s) => ({ balances: addMidr(s.balances, me, FAUCET_AMOUNT) }));
      },
    });
  },
};
