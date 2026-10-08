// Mock data and a tiny in-memory store for NEXT_PUBLIC_USE_MOCKS=true (PRD §16.3).
// Uses exactly the same types as real data, so swapping in the real hooks changes no component.
//
// Covers: one invoice in every status, an overdue Financed invoice (#4), an expired listing (#5),
// a seller with a credit badge (0xb9…e0) and one without (Beras Bu Sari, who earns hers live in the
// demo), an account with no invoices,
// the §9.5 demo invoice (#12), an invoice whose private details never uploaded (#3) and one whose
// details don't match the fingerprint (#8), and a buyer payment record for each tier (§7): RM Selera
// Kita is Reliable (#1, #13–#17), the other buyer is Risky (#4 overdue), and #6's buyer is new.
import { BADGE_VALIDITY_SECONDS } from "@/lib/config";
import { DEMO_WALLETS, MOCK_BUSINESSES } from "@/lib/demo-names";
import type { ProfileAd } from "@/lib/company-profiles";
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
  otherSeller: MOCK_BUSINESSES.rasa.address, // Toko Rasa Nusantara
  konveksi: MOCK_BUSINESSES.konveksi.address,
  percetakan: MOCK_BUSINESSES.percetakan.address,
  buyer3: "0x9a4f62c8e1d07b35a9f4c26e8d10b7a3c5e92f61", // one late payment: "Mixed"
  otherFinancier: "0x61f0c3a8d94e27b5c08a1f6d3e9b27c4a85d0e13",
  otherBuyer: "0xc02a4e67da21c9bd4c955bb930d423da61f18276", // left a financed invoice overdue: "Risky"
  newBuyer: "0x7e1d3a90c4b25f86e0a1d47b3c9f2e58a6b10d24", // no financed history yet: "New buyer"
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

const {
  seller: BU_SARI,
  buyer: RM_SELERA,
  financier: MODAL_MAJU,
  otherSeller,
  otherBuyer,
  newBuyer,
  konveksi,
  percetakan,
  buyer3,
  otherFinancier,
} = MOCK_ADDRESSES;

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
    // Financed and 3 days overdue (makes this buyer's payment record "Risky").
    id: 4, seller: BU_SARI, buyer: otherBuyer, status: "Financed", due: -3,
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
    // Another seller, with a credit badge.
    id: 6, seller: otherSeller, buyer: newBuyer, status: "Listed", due: 45,
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
  // RM Selera Kita's repayment history (§7 buyer payment record): financed invoices from two sellers,
  // all paid on time except one small one, 2 days late. Makes the demo buyer "Reliable".
  {
    id: 13, seller: BU_SARI, buyer: RM_SELERA, status: "Paid", due: -60,
    created: 92 * DAY, responded: 91 * DAY, listed: 90 * DAY, financed: 89 * DAY, paid: 61 * DAY,
    discount: 3, financier: MODAL_MAJU,
    items: [{ name: BERAS_PREMIUM, qty: 500, unitPrice: 15_000 }], description: "June supply, PO #0702",
  },
  {
    id: 14, seller: otherSeller, buyer: RM_SELERA, status: "Paid", due: -45,
    created: 80 * DAY, responded: 79 * DAY, listed: 78 * DAY, financed: 75 * DAY, paid: 46 * DAY,
    discount: 4, financier: MODAL_MAJU,
    items: [{ name: "Kopi bubuk (kg)", qty: 20, unitPrice: 200_000 }], description: "Café supply, July",
  },
  {
    id: 15, seller: BU_SARI, buyer: RM_SELERA, status: "Paid", due: -30,
    created: 62 * DAY, responded: 61 * DAY, listed: 60 * DAY, financed: 59 * DAY, paid: 31 * DAY,
    discount: 3, financier: MODAL_MAJU,
    items: [{ name: BERAS_MEDIUM, qty: 600, unitPrice: 12_500 }], description: "July supply, PO #0733",
  },
  {
    id: 16, seller: otherSeller, buyer: RM_SELERA, status: "Paid", due: -20,
    created: 50 * DAY, responded: 49 * DAY, listed: 48 * DAY, financed: 47 * DAY, paid: 18 * DAY,
    discount: 3, financier: MODAL_MAJU,
    items: [{ name: "Sambal botol (pcs)", qty: 80, unitPrice: 15_000 }], description: "Paid 2 days late",
  },
  {
    id: 17, seller: BU_SARI, buyer: RM_SELERA, status: "Paid", due: -14,
    created: 44 * DAY, responded: 43 * DAY, listed: 42 * DAY, financed: 41 * DAY, paid: 15 * DAY,
    discount: 2.5, financier: MODAL_MAJU,
    items: [{ name: BERAS_PREMIUM, qty: 400, unitPrice: 15_000 }], description: "August supply, PO #0758",
  },

  // Konveksi Maju Jaya (§9.9 Companies): two on-time repayments, one rejected, one expired listing,
  // and one open listing. It runs an active profile ad.
  {
    id: 18, seller: konveksi, buyer: buyer3, status: "Paid", due: -50,
    created: 80 * DAY, responded: 79 * DAY, listed: 78 * DAY, financed: 77 * DAY, paid: 51 * DAY,
    discount: 3, financier: otherFinancier,
    items: [{ name: "Kemeja batik (pcs)", qty: 60, unitPrice: 85_000 }], description: "Store restock, July",
  },
  {
    id: 19, seller: konveksi, buyer: buyer3, status: "Paid", due: -25,
    created: 55 * DAY, responded: 54 * DAY, listed: 53 * DAY, financed: 51 * DAY, paid: 26 * DAY,
    discount: 3.5, financier: otherFinancier,
    items: [{ name: "Kaos polo (pcs)", qty: 120, unitPrice: 45_000 }], description: "Store restock, August",
  },
  {
    id: 20, seller: konveksi, buyer: otherBuyer, status: "Rejected", due: 20,
    created: 12 * DAY, responded: 11 * DAY,
    items: [{ name: "Seragam kantor (set)", qty: 40, unitPrice: 175_000 }], description: "Office uniforms",
  },
  {
    id: 21, seller: konveksi, buyer: buyer3, status: "Listed", due: -4,
    created: 34 * DAY, responded: 33 * DAY, listed: 32 * DAY, discount: 5,
    items: [{ name: "Celana chino (pcs)", qty: 50, unitPrice: 95_000 }], description: "Store restock, September",
  },
  {
    id: 22, seller: konveksi, buyer: buyer3, status: "Listed", due: 35,
    created: 4 * DAY, responded: 3 * DAY, listed: 2 * DAY, discount: 3,
    items: [{ name: "Kemeja batik (pcs)", qty: 100, unitPrice: 85_000 }], description: "Store restock, October",
  },

  // Percetakan Sinar Abadi: one on time, one 12 days late, and one financed invoice 40 days overdue.
  {
    id: 23, seller: percetakan, buyer: otherBuyer, status: "Financed", due: -40,
    created: 70 * DAY, responded: 69 * DAY, listed: 68 * DAY, financed: 66 * DAY, discount: 4, financier: otherFinancier,
    items: [{ name: "Brosur A4 (rim)", qty: 30, unitPrice: 250_000 }], description: "Promo brochures",
  },
  {
    id: 24, seller: percetakan, buyer: buyer3, status: "Paid", due: -60,
    created: 95 * DAY, responded: 94 * DAY, listed: 93 * DAY, financed: 90 * DAY, paid: 48 * DAY,
    discount: 3, financier: otherFinancier,
    items: [{ name: "Kalender meja (pcs)", qty: 200, unitPrice: 18_000 }], description: "2027 desk calendars",
  },
  {
    id: 25, seller: percetakan, buyer: buyer3, status: "Paid", due: -90,
    created: 125 * DAY, responded: 124 * DAY, listed: 123 * DAY, financed: 122 * DAY, paid: 92 * DAY,
    discount: 3, financier: otherFinancier,
    items: [{ name: "Spanduk (m²)", qty: 120, unitPrice: 35_000 }], description: "Store banners",
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
// Worst case (break-ui): realistic extremes at the limits PRD §7 allows, spread across the first rows,
// plus a long tail so lists are tested at about 200 invoices. Loaded from the mock wallet menu.

const LONG_ITEM = "Beras premium organik pandan wangi Cianjur, karung 25 kg";
const LONG_DESCRIPTION =
  "Pengiriman tahap kedua untuk cabang Kemang dan Kelapa Gading sesuai PO #2026/10/0815-B. Barang diterima lengkap oleh Pak Bartholomeus Wicaksono-Hadiningrat, kepala gudang. Mohon konfirmasi sebelum tanggal jatuh tempo agar pembayaran dapat diproses tepat waktu. Terima kasih banyak.";
const LONG_TAIL_STATUSES: InvoiceStatus[] = ["Listed", "Created", "Verified", "Financed", "Paid", "Rejected"];

function worstSeeds(): Seed[] {
  const head: Seed[] = [
    {
      // The largest invoice the contract accepts, listed at the deepest discount, due a year out.
      id: 1, seller: BU_SARI, buyer: otherBuyer, status: "Listed", due: 365,
      created: 3 * DAY, responded: 2 * DAY, listed: 1 * DAY, discount: 10,
      items: [{ name: LONG_ITEM.slice(0, 60), qty: 1, unitPrice: 10_000_000_000 }],
      description: LONG_DESCRIPTION.slice(0, 280),
    },
    {
      // The smallest invoice, financed, four months overdue.
      id: 2, seller: BU_SARI, buyer: RM_SELERA, status: "Financed", due: -120,
      created: 160 * DAY, responded: 159 * DAY, listed: 158 * DAY, financed: 157 * DAY, discount: 1, financier: MODAL_MAJU,
      items: [{ name: "Garam", qty: 1, unitPrice: 100_000 }],
    },
    {
      // Five items, a million each, at the total limit; waiting for the buyer.
      id: 3, seller: BU_SARI, buyer: RM_SELERA, status: "Created", due: 1,
      created: 30,
      items: Array.from({ length: 5 }, (_, i) => ({ name: `${LONG_ITEM.slice(0, 54)} #${i + 1}`, qty: 1_000_000, unitPrice: 2_000 })),
      description: LONG_DESCRIPTION.slice(0, 280),
    },
    {
      // Listed by the badge-less seller at the limit, due tomorrow.
      id: 4, seller: otherSeller, buyer: RM_SELERA, status: "Listed", due: 1,
      created: 20 * DAY, responded: 19 * DAY, listed: 2 * HOUR, discount: 0.5 + 0.5,
      items: [{ name: "Kopi", qty: 4_000, unitPrice: 2_500_000 }],
    },
  ];
  const tail: Seed[] = Array.from({ length: 196 }, (_, i) => {
    const id = i + 5;
    const status = LONG_TAIL_STATUSES[i % LONG_TAIL_STATUSES.length];
    const confirmed = status !== "Created" && status !== "Rejected";
    const financed = status === "Financed" || (status === "Paid" && i % 2 === 0);
    return {
      id,
      seller: i % 3 === 0 ? otherSeller : BU_SARI,
      buyer: i % 4 === 0 ? otherBuyer : RM_SELERA,
      status,
      due: 5 + ((i * 7) % 90),
      created: (40 + i) * HOUR,
      responded: confirmed || status === "Rejected" ? (30 + i) * HOUR : undefined,
      listed: status === "Listed" || financed ? (20 + i) * HOUR : undefined,
      financed: financed ? (10 + i) * HOUR : undefined,
      paid: status === "Paid" ? (5 + i) * HOUR : undefined,
      discount: status === "Listed" || financed ? 1 + (i % 19) * 0.5 : undefined,
      financier: financed ? MODAL_MAJU : undefined,
      items: [{ name: `Beras medium (kg) batch ${id}`, qty: 100 + i, unitPrice: 12_500 + i * 100 }],
    };
  });
  return [...head, ...tail];
}

function createWorstData(now: number): Pick<MockState, "invoices" | "details" | "mismatched" | "badges" | "balances"> {
  const seeded = worstSeeds().map((seed) => fromSeed(seed, now));
  const badge = { threshold: 500_000_000n, attestedAt: now - 29 * DAY, verifiedAt: now - 29 * DAY + 60 };
  return {
    invoices: seeded.map((s) => s.invoice),
    details: Object.fromEntries(seeded.flatMap((s) => (s.details ? [[s.details.commitment, s.details]] : []))),
    mismatched: [],
    badges: { [otherSeller]: { ...badge, isValid: badgeIsValid(badge, now) } },
    balances: {
      [BU_SARI]: { midr: 9_999_999_999n, eth: 1n },
      [RM_SELERA]: { midr: 0n, eth: 0n },
      [MODAL_MAJU]: { midr: 1n, eth: (5n * ETH) / 1_000n },
    },
  };
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
  ads: ProfileAd[]; // off-chain profile ads (§7), mock-only
}

function createInitialState(now: number): MockState {
  const seeded = SEEDS.map((seed) => fromSeed(seed, now));
  // The other seller has a badge; Bu Sari earns hers live in the demo (§19 at 1:10).
  const otherBadge = { threshold: 50_000_000n, attestedAt: now - 12 * DAY, verifiedAt: now - 12 * DAY + 10 * 60 };

  return {
    account: "seller",
    wrongNetwork: false,
    cancelNextTx: false,
    loaded: false,
    invoices: seeded.map((s) => s.invoice),
    details: Object.fromEntries(seeded.flatMap((s) => (s.details ? [[s.details.commitment, s.details]] : []))),
    mismatched: MISMATCHED_IDS.map((id) => mockHex(id)),
    badges: { [otherSeller]: { ...otherBadge, isValid: badgeIsValid(otherBadge, now) } },
    ads: [
      { seller: konveksi, tier: 2, bid: 75_000, endsAt: now + 6 * DAY },
      { seller: otherSeller, tier: 1, bid: 40_000, endsAt: now - 2 * DAY }, // expired: ranks as organic
    ],
    balances: {
      [BU_SARI]: { midr: 25_400_000n, eth: (35n * ETH) / 100n },
      [RM_SELERA]: { midr: 2_000_000n, eth: (20n * ETH) / 100n },
      [MODAL_MAJU]: { midr: 82_000_000n, eth: (50n * ETH) / 100n },
      [MOCK_ADDRESSES.empty]: { midr: 0n, eth: (4n * ETH) / 1_000n }, // low gas
    },
  };
}

// Each tab is its own wallet (sessionStorage), so a seller, buyer and financier window can run side
// by side. The invoice data is shared through localStorage and the `storage` event, so those three
// windows react to each other live, like the real demo on Sepolia (PRD §1, §19).
const ACCOUNT_KEY = "revine.mockAccount";
const DATA_KEY = "revine.mockData.v3"; // bumped when the seed data changes
const LOAD_DELAY_MS = 700;

type MockData = Pick<MockState, "invoices" | "details" | "mismatched" | "badges" | "balances" | "ads">;
const DATA_FIELDS = ["invoices", "details", "mismatched", "badges", "balances", "ads"] as const;

function pickData(s: MockState): MockData {
  return {
    invoices: s.invoices,
    details: s.details,
    mismatched: s.mismatched,
    badges: s.badges,
    balances: s.balances,
    ads: s.ads,
  };
}

function serialize(data: MockData): string {
  return JSON.stringify(data, (_, value) => (typeof value === "bigint" ? { $bigint: value.toString() } : value));
}

function deserialize(text: string | null): MockData | null {
  if (!text) return null;
  try {
    return JSON.parse(text, (_, value) =>
      value !== null && typeof value === "object" && typeof value.$bigint === "string" ? BigInt(value.$bigint) : value,
    );
  } catch {
    return null;
  }
}

function readStorage(storage: "localStorage" | "sessionStorage", key: string): string | null {
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: "localStorage" | "sessionStorage", key: string, value: string) {
  try {
    window[storage].setItem(key, value);
  } catch {
    // Storage blocked (private window): this tab keeps working, it just won't sync or survive a reload.
  }
}

function readStoredAccount(): MockAccountKey | null {
  const stored = readStorage("sessionStorage", ACCOUNT_KEY);
  if (stored === "none") return null;
  return MOCK_ACCOUNTS.find((a) => a.key === stored)?.key ?? "seller";
}

const SERVER_STATE = createInitialState(nowSeconds());
let state: MockState = SERVER_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function initClient() {
  initialized = true;
  const fresh = createInitialState(nowSeconds());
  const stored = deserialize(readStorage("localStorage", DATA_KEY));
  state = { ...fresh, ...(stored ?? {}), account: readStoredAccount() };
  if (!stored) writeStorage("localStorage", DATA_KEY, serialize(pickData(state)));

  // Another tab changed the shared data: take it.
  window.addEventListener("storage", (event) => {
    if (event.key !== DATA_KEY) return;
    const data = deserialize(event.newValue);
    if (!data) return;
    state = { ...state, ...data };
    emit();
  });

  queueMicrotask(emit);
  // Simulate the first fetch so loading skeletons show.
  setTimeout(() => mockStore.update(() => ({ loaded: true })), LOAD_DELAY_MS);
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
    if (!initialized && typeof window !== "undefined") initClient();
    return () => listeners.delete(listener);
  },

  update(change: (current: MockState) => Partial<MockState>) {
    const previous = state;
    state = { ...state, ...change(state) };
    if (DATA_FIELDS.some((field) => state[field] !== previous[field])) {
      writeStorage("localStorage", DATA_KEY, serialize(pickData(state)));
    }
    emit();
  },

  setAccount(account: MockAccountKey | null) {
    writeStorage("sessionStorage", ACCOUNT_KEY, account ?? "none");
    mockStore.update(() => ({ account, wrongNetwork: false }));
  },

  /** Back to the seeded demo data, in every open tab. */
  reset() {
    mockStore.update(() => pickData(createInitialState(nowSeconds())));
  },

  /** break-ui: swap in the worst-case dataset, in every open tab. */
  loadWorstCase() {
    mockStore.update(() => createWorstData(nowSeconds()));
  },
};

export function mockAccountAddress(account: MockAccountKey | null): Address | undefined {
  return MOCK_ACCOUNTS.find((a) => a.key === account)?.address;
}
