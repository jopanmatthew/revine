export type Address = `0x${string}`;

export type InvoiceStatus = 'Created' | 'Verified' | 'Rejected' | 'Listed' | 'Financed' | 'Paid';
// Index = contract enum value
export const STATUSES: InvoiceStatus[] = ['Created', 'Verified', 'Rejected', 'Listed', 'Financed', 'Paid'];

export interface Invoice {
  id: bigint;
  seller: Address;
  buyer: Address;
  holder: Address | null;   // null until the buyer confirms (token not minted yet)
  faceAmount: bigint;       // mIDR, 0 decimals = rupiah
  askPrice: bigint;         // 0n until listed; after financing = price paid
  commitment: `0x${string}`;
  dueDate: number;          // unix seconds
  createdAt: number;        // unix seconds; 0 = not yet (same for the fields below)
  respondedAt: number;
  listedAt: number;
  financedAt: number;
  paidAt: number;
  status: InvoiceStatus;
}

export interface CreditBadge {
  threshold: bigint;        // rupiah
  attestedAt: number;
  verifiedAt: number;       // 0 = no badge
  isValid: boolean;         // verifiedAt > 0 && now - attestedAt <= 30 days
}

export interface InvoiceItem {
  name: string;
  qty: number;
  unitPrice: number;        // whole rupiah
}

export interface InvoiceDetails {
  commitment: `0x${string}`;
  seller: Address;
  buyer: Address;
  faceAmount: number;
  dueDate: number;
  items: InvoiceItem[];     // 1–5
  description: string;
  salt: `0x${string}`;
}

export interface CreateInvoiceInput {
  buyer: Address;
  items: InvoiceItem[];
  dueDate: number;          // unix seconds, 23:59:59 WIB
  description: string;
}

export interface Attestation {
  revenue: number;
  attestedAt: number;
  signature: `0x${string}`;
}

export type TxStep =
  | 'verify-wallet'
  | 'proving'
  | 'saving-details'
  | 'approving'
  | 'wallet'
  | 'pending'
  | 'success'
  | 'error';

export type OnStep = (step: TxStep, info?: { hash?: `0x${string}`; error?: string }) => void;
