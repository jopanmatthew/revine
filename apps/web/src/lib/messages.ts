// Friendly messages from PRD §11. Use these strings exactly; don't reword them in components.
import { formatRupiah } from "@/lib/format";

export const MESSAGES = {
  // Wallet and network
  notConnected: "Connect your wallet to continue.",
  wrongNetwork: (network: string) => `revine. runs on Sepolia. You're on ${network}.`,
  userRejected: "You cancelled in your wallet. Nothing was sent.",
  noEth: "You need a little Sepolia ETH to pay the network fee.",
  noMidr: (amount: bigint, balance: bigint) =>
    `You need ${formatRupiah(amount)} mIDR but have ${formatRupiah(balance)}.`,
  rpcBusy: "The network is busy. Retrying…",
  slowTx: "Still waiting for Sepolia. This can take a minute when the network is busy.",

  // Create invoice form
  buyerInvalid: "That doesn't look like a wallet address (0x… with 42 characters).",
  buyerIsSelf: "You can't send an invoice to yourself. Enter your buyer's wallet.",
  itemNameEmpty: "Give this item a name.",
  qtyInvalid: "Quantity must be a whole number from 1 to 1.000.000.",
  unitPriceInvalid: "Unit price must be a whole rupiah amount above 0.",
  totalOutOfRange: "Invoices must be between Rp100.000 and Rp10.000.000.000.",
  dueDateTooSoon: "Pick a due date after today.",
  dueDateTooFar: "Pick a due date within the next 12 months.",

  // Privacy proofs and private details
  verificationDeclined:
    "We need a free signature to show private invoice details. It doesn't send a transaction.",
  proofSlow: "Creating your privacy proof… this can take up to a minute on slower devices.",
  proofFailed: "We couldn't create the privacy proof. Try again — if it keeps failing, refresh the page.",
  proofRejected: "The network rejected the privacy proof. Please create it again.",
  detailsMissingBuyer:
    "The seller's private details haven't arrived yet. Ask the seller to open the invoice and upload them again.",
  detailsMissingSeller: "Your private details didn't upload.",
  fingerprintMismatch: "⚠ These details don't match the on-chain record. Don't confirm — contact the seller.",
  detailsForbidden: "Only the seller and buyer can see these details.",

  // Credit badge
  attesterUnavailable: "The demo bank is offline. Try again in a minute.",
  tierTooHigh: "Your revenue doesn't reach this tier.",
  badgeExpired: "Your badge expired. Create a new one.",
  attestationTooOld: "This attestation is older than 30 days. Connect the demo bank again.",

  // Contract errors that need a different message in one flow
  buyWrongStatus: "Someone else just financed this invoice.",
  generic: "Something went wrong and the action didn't go through.",
} as const;

export type ContractErrorName =
  | "NotBuyer"
  | "NotHolder"
  | "WrongStatus"
  | "InvalidBuyer"
  | "InvalidAmount"
  | "InvalidDueDate"
  | "CommitmentUsed"
  | "InvalidProof"
  | "InvalidPrice"
  | "PastDue"
  | "CannotBuyOwn"
  | "TransfersDisabled"
  | "AttestationExpired";

/** Contract custom errors → friendly messages (§11). Anything unknown → MESSAGES.generic. */
export const CONTRACT_ERROR_MESSAGES: Record<ContractErrorName, string> = {
  NotBuyer: "Only the buyer on this invoice can do this.",
  NotHolder: "Only the current holder of this invoice can do this.",
  WrongStatus: "This invoice changed while you were looking. Refresh to see its latest status.",
  InvalidBuyer: "Check the buyer's wallet address.",
  InvalidAmount: "Check the invoice amount.",
  InvalidDueDate: "Pick a due date after today.",
  CommitmentUsed: "This invoice already exists on revine.",
  InvalidProof: "The network rejected the privacy proof. Please create it again.",
  InvalidPrice: "The price must be above Rp0 and no more than the invoice amount.",
  PastDue: "This invoice is past its due date and can't be financed.",
  CannotBuyOwn: "You can't finance your own invoice.",
  TransfersDisabled: "Invoice tokens can only change hands through revine.",
  AttestationExpired: "This attestation is older than 30 days. Connect the demo bank again.",
};

/** Wallet cancellations are neutral (gray), not red (§11). */
export function isNeutralError(message: string): boolean {
  return message === MESSAGES.userRejected || message === MESSAGES.verificationDeclined;
}
