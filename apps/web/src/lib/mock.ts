// Mock data and a tiny in-memory store for NEXT_PUBLIC_USE_MOCKS=true (PRD §16.3).
// Uses exactly the same types as real data, so swapping in the real hooks changes no component.
//
// Covers: one invoice in every status, an overdue Financed invoice (#4), an expired listing (#5),
// a seller with a credit badge (Beras Bu Sari) and one without, an account with no invoices,
// the §9.5 demo invoice (#12), an invoice whose private details never uploaded (#3) and one whose
// details don't match the fingerprint (#8).
import { BADGE_VALIDITY_SECONDS } from "@/lib/config";
import { DEMO_WALLETS } from "@/lib/demo-names";
import { dueDateInDays, nowSeconds, priceFromDiscount, SECONDS_PER_DAY } from "@/lib/format";
import type { Address, CreditBadge, Invoice, InvoiceDetails, InvoiceItem, InvoiceStatus } from "@/lib/types";

const DAY = SECONDS_PER_DAY;
const HOUR = 3_600;
const ETH = 1_000_000_000_000_000_000n;

export const MOCK_ADDRESSES = {
  seller: DEMO_WALLETS.seller.address,
  buyer: DEMO_WALLETS.buyer.address,
  financier: DEMO_WALLETS.financier.address,
  empty: "0x4b7bd360fe7afbae6a5a2760927466741b333177",
  otherSeller: "0xb9c15b91c205c8240690197791a9cfd24d3e3be0", // no credit badge, no demo name
  otherBuyer: "0xc02a4e67da21c9bd4c955bb930d423da61f18276",
} as const satisfies Record<string, Address>;

export type MockAccountKey = "seller" | "buyer" | "financier" | "empty";

export const MOCK_ACCOUNTS: { key: MockAccountKey; label: string; address: Address }[] = [
  { key: "seller", label: DEMO_WALLETS.seller.name, address: MOCK_ADDRESSES.seller },
  { key: "buyer", label: DEMO_WALLETS.buyer.name, address: MOCK_ADDRESSES.buyer },
  { key: "financier", label: DEMO_WALLETS.financier.name, address: MOCK_ADDRESSES.financier },
  { key: "empty", label: "Empty account", address: MOCK_ADDRESSES.empty },
];

/** The §9.5 demo invoice, also used by [Fill demo invoice]. */
export const DEMO_INVOICE = {
  buyer: MOCK_ADDRESSES.buyer,
  items: [
    { name: "Beras premium (kg)", qty: 500, unitPrice: 15_000 },
    { name: "Beras medium (kg)", qty: 200, unitPrice: 12_500 },
  ],
  dueInDays: 30,
  description: "Delivered 8 Oct, PO #0815",
} as const satisfies { buyer: Address; items: InvoiceItem[]; dueInDays: number; description: string };

/** Mock revenue from the demo bank (§7): demo seller 180 jt, anyone else 120 jt. */
export function mockRevenue(address: string): number {
  return address.toLowerCase() === MOCK_ADDRESSES.seller ? 180_000_000 : 120_000_000;
}

export function badgeIsValid(badge: Omit<CreditBadge, "isValid">, now = nowSeconds()): boolean {
  return badge.verifiedAt > 0 && now - badge.attestedAt <= BADGE_VALIDITY_SECONDS;
}

/** Deterministic fake hex so fingerprints are stable between renders. */
export function mockHex(seed: number, bytes = 32): `0x${string}` {
  let x = (seed * 2_654_435_761) >>> 0;
  let out = "";
  while (out.length < bytes * 2) {
    x = (Math.imul(x ^ (x >>> 15), 2_246_822_507) + 0x9e3779b9) >>> 0;
    out += x.toString(16).padStart(8, "0");
  }
  return `0x${out.slice(0, bytes * 2)}`;
}

/** Random hex for new fingerprints, salts and transaction hashes. */
export function randomHex(bytes = 32): `0x${string}` {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return `0x${Array.from(values, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function itemsTotal(items: readonly InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

// ---------------------------------------------------------------------------
// Seed data

interface Seed {
  id: number;
  seller: Address;
  buyer: Address;
  status: InvoiceStatus;
  due: number; // WIB calendar days from today; negative = past due
  created: number; // seconds before now
  responded?: number;
  listed?: number;
  financed?: number;
  paid?: number;
  discount?: number; // percent, for Listed/Financed and financed Paid invoices
  financier?: Address;
  items?: InvoiceItem[]; // omitted = private details never uploaded
  faceAmount?: number; // only when items are omitted
  description?: string;
}

const BERAS_PREMIUM = "Beras premium (kg)";
const BERAS_MEDIUM = "Beras medium (kg)";
const BERAS_MERAH = "Beras merah (kg)";

const { seller: BU_SARI, buyer: RM_SELERA, financier: MODAL_MAJU, otherSeller, otherBuyer } = MOCK_ADDRESSES;

const SEEDS: Seed[] = [
  {
    id: 1, seller: BU_SARI, buyer: RM_SELERA, status: "Paid", due: -8,
    created: 52 * DAY, responded: 51 * DAY, listed: 50 * DAY, financed: 50 * DAY - 3 * HOUR, paid: 9 * DAY,
    discount: 2.5, financier: MODAL_MAJU,
    items: [{ name: BERAS_PREMIUM, qty: 500, unitPrice: 15_000 }, { name: BERAS_MERAH, qty: 100, unitPrice: 10_000 }],
    description: "August supply, PO #0761",
  },
  {
    id: 2, seller: BU_SARI, buyer: RM_SELERA, status: "Rejected", due: 10,
    created: 20 * DAY, responded: 19 * DAY,
    items: [{ name: BERAS_MEDIUM, qty: 220, unitPrice: 12_500 }],
    description: "Duplicate of PO #0790",
  },
  {
    // Repaid straight to the seller (never financed). Private details never uploaded.
    id: 3, seller: BU_SARI, buyer: otherBuyer, status: "Paid", due: -5,
    created: 40 * DAY, responded: 39 * DAY, paid: 6 * DAY, faceAmount: 4_200_000,
  },
  {
    // Financed and 3 days overdue.
    id: 4, seller: BU_SARI, buyer: RM_SELERA, status: "Financed", due: -3,
    created: 36 * DAY, responded: 35 * DAY, listed: 34 * DAY, financed: 33 * DAY, discount: 3, financier: MODAL_MAJU,
    items: [{ name: BERAS_PREMIUM, qty: 400, unitPrice: 15_000 }],
    description: "Delivered 2 Sep, PO #0774",
  },
  {
    // Listing expired: still Listed, 2 days past due.
    id: 5, seller: BU_SARI, buyer: RM_SELERA, status: "Listed", due: -2,
    created: 33 * DAY, responded: 32 * DAY, listed: 31 * DAY, discount: 3,
    items: [{ name: BERAS_MEDIUM, qty: 280, unitPrice: 12_500 }],
    description: "Delivered 5 Sep, PO #0779",
  },
  {
    // Another seller, no credit badge.
    id: 6, seller: otherSeller, buyer: otherBuyer, status: "Listed", due: 45,
    created: 6 * DAY, responded: 5 * DAY, listed: 4 * DAY, discount: 4,
    items: [{ name: "Kopi bubuk (kg)", qty: 25, unitPrice: 200_000 }],
    description: "Café supply, September",
  },
  {
    id: 7, seller: BU_SARI, buyer: RM_SELERA, status: "Financed", due: 21,
    created: 12 * DAY, responded: 11 * DAY, listed: 10 * DAY, financed: 9 * DAY, discount: 3, financier: MODAL_MAJU,
    items: [{ name: BERAS_PREMIUM, qty: 400, unitPrice: 15_000 }, { name: BERAS_MEDIUM, qty: 100, unitPrice: 12_500 }],
    description: "Delivered 26 Sep, PO #0801",
  },
  {
    // Waiting for RM Selera Kita. Its details don't match the fingerprint (tests the buyer warning).
    id: 8, seller: otherSeller, buyer: RM_SELERA, status: "Created", due: 30,
    created: 2 * HOUR,
    items: [{ name: "Sambal botol (pcs)", qty: 120, unitPrice: 15_000 }],
    description: "Delivered 8 Oct",
  },
  {
    id: 9, seller: BU_SARI, buyer: RM_SELERA, status: "Listed", due: 45,
    created: 5 * DAY, responded: 4 * DAY, listed: 3 * DAY, discount: 3,
    items: [{ name: BERAS_PREMIUM, qty: 800, unitPrice: 15_000 }],
    description: "Monthly supply, October",
  },
  {
    id: 10, seller: BU_SARI, buyer: RM_SELERA, status: "Created", due: 30,
    created: 1 * DAY,
    items: [{ name: BERAS_PREMIUM, qty: 300, unitPrice: 15_000 }, { name: BERAS_MERAH, qty: 100, unitPrice: 11_000 }],
    description: "Delivered 7 Oct, PO #0812",
  },
  {
    id: 11, seller: BU_SARI, buyer: otherBuyer, status: "Verified", due: 14,
    created: 4 * DAY, responded: 3 * DAY,
    items: [{ name: BERAS_MEDIUM, qty: 192, unitPrice: 12_500 }],
    description: "Delivered 4 Oct",
  },
  {
    // The §9.5 demo invoice, confirmed and ready to finance (3% → Rp9.700.000).
    id: 12, seller: BU_SARI, buyer: DEMO_INVOICE.buyer, status: "Verified", due: DEMO_INVOICE.dueInDays,
    created: 3 * HOUR, responded: 1 * HOUR,
    items: [...DEMO_INVOICE.items], description: DEMO_INVOICE.description,
  },
];

const MISMATCHED_IDS = [8];

function fromSeed(seed: Seed, now: number): { invoice: Invoice; details: InvoiceDetails | null } {
  const at = (ago?: number) => (ago === undefined ? 0 : now - ago);
  const faceAmount = seed.items ? itemsTotal(seed.items) : (seed.faceAmount ?? 0);
  const askPrice = seed.discount === undefined ? 0n : priceFromDiscount(BigInt(faceAmount), seed.discount);
  const confirmed = seed.status !== "Created" && seed.status !== "Rejected";
  const dueDate = dueDateInDays(seed.due, now);
  const commitment = mockHex(seed.id);

  const invoice: Invoice = {
    id: BigInt(seed.id),
    seller: seed.seller,
    buyer: seed.buyer,
    holder: !confirmed ? null : (seed.financier ?? seed.seller),
    faceAmount: BigInt(faceAmount),
    askPrice,
    commitment,
    dueDate,
    createdAt: at(seed.created),
    respondedAt: at(seed.responded),
    listedAt: at(seed.listed),
    financedAt: at(seed.financed),
    paidAt: at(seed.paid),
    status: seed.status,
  };
  const details: InvoiceDetails | null = seed.items
    ? {
        commitment,
        seller: seed.seller,
        buyer: seed.buyer,
        faceAmount,
        dueDate,
        items: seed.items,
        description: seed.description ?? "",
        salt: mockHex(seed.id + 1_000, 31),
      }
    : null;
  return { invoice, details };
}

// ---------------------------------------------------------------------------
// Store

export interface MockBalance {
  midr: bigint;
  eth: bigint; // wei
}

export interface MockState {
  account: MockAccountKey | null; // null = disconnected
  wrongNetwork: boolean; // simulate a wallet on another network
  cancelNextTx: boolean; // simulate cancelling the next wallet prompt
  loaded: boolean; // false until the first simulated fetch finishes
  invoices: Invoice[];
  details: Record<string, InvoiceDetails>; // by fingerprint
  mismatched: string[]; // fingerprints whose details don't match
  badges: Record<string, CreditBadge>; // by lowercase address
  balances: Record<string, MockBalance>; // by lowercase address
}

function createInitialState(now: number): MockState {
  const seeded = SEEDS.map((seed) => fromSeed(seed, now));
  const busariBadge = { threshold: 100_000_000n, attestedAt: now - 5 * DAY, verifiedAt: now - 5 * DAY + 10 * 60 };

  return {
    account: "seller",
    wrongNetwork: false,
    cancelNextTx: false,
    loaded: false,
    invoices: seeded.map((s) => s.invoice),
    details: Object.fromEntries(seeded.flatMap((s) => (s.details ? [[s.details.commitment, s.details]] : []))),
    mismatched: MISMATCHED_IDS.map((id) => mockHex(id)),
    badges: { [BU_SARI]: { ...busariBadge, isValid: badgeIsValid(busariBadge, now) } },
    balances: {
      [BU_SARI]: { midr: 25_400_000n, eth: (35n * ETH) / 100n },
      [RM_SELERA]: { midr: 2_000_000n, eth: (20n * ETH) / 100n },
      [MODAL_MAJU]: { midr: 82_000_000n, eth: (50n * ETH) / 100n },
      [MOCK_ADDRESSES.empty]: { midr: 0n, eth: (4n * ETH) / 1_000n }, // low gas
    },
  };
}

const ACCOUNT_STORAGE_KEY = "revine.mockAccount";
const LOAD_DELAY_MS = 700;

function readStoredAccount(): MockAccountKey | null | undefined {
  try {
    const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (stored === "none") return null;
    return MOCK_ACCOUNTS.find((a) => a.key === stored)?.key;
  } catch {
    return undefined;
  }
}

function writeStoredAccount(account: MockAccountKey | null) {
  try {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, account ?? "none");
  } catch {
    // Storage blocked (private window); the choice just won't survive a reload.
  }
}

const SERVER_STATE = createInitialState(nowSeconds());
let state: MockState = SERVER_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const mockStore = {
  getState(): MockState {
    return state;
  },

  /** What the server renders (and hydration starts from): nothing loaded yet. */
  getServerState(): MockState {
    return SERVER_STATE;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (!initialized && typeof window !== "undefined") {
      initialized = true;
      const stored = readStoredAccount();
      state = { ...createInitialState(nowSeconds()), account: stored === undefined ? "seller" : stored };
      queueMicrotask(emit);
      // Simulate the first fetch so loading skeletons show.
      setTimeout(() => mockStore.update(() => ({ loaded: true })), LOAD_DELAY_MS);
    }
    return () => listeners.delete(listener);
  },

  update(change: (current: MockState) => Partial<MockState>) {
    state = { ...state, ...change(state) };
    emit();
  },

  setAccount(account: MockAccountKey | null) {
    writeStoredAccount(account);
    mockStore.update(() => ({ account, wrongNetwork: false }));
  },
};

export function mockAccountAddress(account: MockAccountKey | null): Address | undefined {
  return MOCK_ACCOUNTS.find((a) => a.key === account)?.address;
}
