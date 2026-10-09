import { isAddress } from "viem";

import {
  decodeWalletVerificationHeader,
  parseWalletVerification,
  verifyWallet,
} from "@/lib/server/wallet-verification";

const HEX_32 = /^0x[0-9a-fA-F]{64}$/;
const MAX_DESCRIPTION = 280;
const MAX_FACE_AMOUNT = 10_000_000_000;

interface InvoiceDetailBody {
  commitment: string;
  seller: string;
  buyer: string;
  faceAmount: number;
  dueDate: number;
  items: { name: string; qty: number; unitPrice: number }[];
  description: string;
  salt: string;
}

function validDetails(value: unknown): value is InvoiceDetailBody {
  if (!value || typeof value !== "object") return false;
  const details = value as Partial<InvoiceDetailBody>;
  if (
    typeof details.commitment !== "string" ||
    !HEX_32.test(details.commitment) ||
    typeof details.salt !== "string" ||
    !HEX_32.test(details.salt) ||
    typeof details.seller !== "string" ||
    !isAddress(details.seller) ||
    typeof details.buyer !== "string" ||
    !isAddress(details.buyer) ||
    details.seller.toLowerCase() === details.buyer.toLowerCase() ||
    !Number.isSafeInteger(details.faceAmount) ||
    details.faceAmount! < 100_000 ||
    details.faceAmount! > MAX_FACE_AMOUNT ||
    !Number.isSafeInteger(details.dueDate) ||
    details.dueDate! <= Math.floor(Date.now() / 1000) ||
    details.dueDate! > Math.floor(Date.now() / 1000) + 366 * 86_400 ||
    !Array.isArray(details.items) ||
    details.items.length < 1 ||
    details.items.length > 5 ||
    typeof details.description !== "string" ||
    details.description.length > MAX_DESCRIPTION
  ) {
    return false;
  }

  let total = 0n;
  for (const item of details.items) {
    if (
      !item ||
      typeof item.name !== "string" ||
      item.name.trim().length === 0 ||
      item.name.length > 60 ||
      !Number.isSafeInteger(item.qty) ||
      item.qty < 1 ||
      item.qty > 1_000_000 ||
      !Number.isSafeInteger(item.unitPrice) ||
      item.unitPrice < 1 ||
      item.unitPrice > 10_000_000_000
    ) {
      return false;
    }
    total += BigInt(item.qty!) * BigInt(item.unitPrice!);
  }
  return total === BigInt(details.faceAmount!);
}

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

function supabaseHeaders(key: string): HeadersInit {
  // New Supabase secret keys are API keys, not JWTs. The gateway resolves their
  // service_role permissions from apikey; putting one in Authorization rejects it.
  if (key.startsWith("sb_secret_")) return { apikey: key };
  return { apikey: key, Authorization: `Bearer ${key}` };
}

async function storageFailure(response: Response): Promise<Response> {
  const body = (await response.clone().json().catch(() => null)) as { code?: unknown } | null;
  if (body?.code === "PGRST205" || body?.code === "42P01") {
    return Response.json({ code: "STORAGE_SCHEMA_MISSING" }, { status: 503 });
  }
  if (response.status === 401 || response.status === 403) {
    return Response.json({ code: "STORAGE_AUTH_FAILED" }, { status: 503 });
  }
  return Response.json({ code: "STORAGE_REQUEST_FAILED" }, { status: 502 });
}

export async function POST(request: Request) {
  const config = supabaseConfig();
  if (!config) return Response.json({ code: "STORAGE_NOT_CONFIGURED" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request." }, { status: 400 });
  const payload = body as Record<string, unknown>;
  const details = payload.details;
  const verification = parseWalletVerification(payload.walletVerification);
  if (!validDetails(details) || !verification) return Response.json({ error: "Invalid details." }, { status: 400 });

  const signer = await verifyWallet(verification);
  if (!signer) return Response.json({ error: "Wallet verification expired. Sign again." }, { status: 401 });
  if (signer !== details.seller.toLowerCase()) {
    return Response.json({ error: "Only the invoice seller can upload its details." }, { status: 403 });
  }

  const response = await fetch(`${config.url}/rest/v1/invoice_details`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(config.key),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      commitment: details.commitment.toLowerCase(),
      seller: details.seller.toLowerCase(),
      buyer: details.buyer.toLowerCase(),
      face_amount: details.faceAmount,
      due_date: details.dueDate,
      items: details.items,
      description: details.description,
      salt: details.salt.toLowerCase(),
    }),
    cache: "no-store",
  });

  if (response.status === 409) return Response.json({ error: "Details already exist." }, { status: 409 });
  if (!response.ok) return storageFailure(response);
  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const config = supabaseConfig();
  if (!config) return Response.json({ code: "STORAGE_NOT_CONFIGURED" }, { status: 503 });

  const url = new URL(request.url);
  const commitment = url.searchParams.get("commitment");
  if (!commitment || !HEX_32.test(commitment)) {
    return Response.json({ error: "A valid invoice commitment is required." }, { status: 400 });
  }

  const verification = decodeWalletVerificationHeader(request.headers.get("x-revine-auth"));
  if (!verification) return Response.json({ error: "Wallet verification is required." }, { status: 401 });
  const signer = await verifyWallet(verification);
  if (!signer) return Response.json({ error: "Wallet verification expired. Sign again." }, { status: 401 });

  const query = new URLSearchParams({
    select: "commitment,seller,buyer,face_amount,due_date,items,description,salt",
    commitment: `eq.${commitment.toLowerCase()}`,
    limit: "1",
  });
  const response = await fetch(`${config.url}/rest/v1/invoice_details?${query}`, {
    headers: supabaseHeaders(config.key),
    cache: "no-store",
  });
  if (!response.ok) return storageFailure(response);

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  const row = rows[0];
  if (!row) return Response.json({ error: "Invoice details are not available yet." }, { status: 404 });
  if (signer !== row.seller && signer !== row.buyer) {
    return Response.json({ error: "Only the invoice seller and buyer can view these details." }, { status: 403 });
  }

  return Response.json({
    commitment: row.commitment,
    seller: row.seller,
    buyer: row.buyer,
    faceAmount: Number(row.face_amount),
    dueDate: Number(row.due_date),
    items: row.items,
    description: row.description,
    salt: row.salt,
  });
}
