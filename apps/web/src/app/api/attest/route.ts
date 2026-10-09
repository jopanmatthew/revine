import { isAddress } from "viem";

import { AttesterNotConfiguredError, createDemoAttestation } from "@/lib/server/attestation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).seller !== "string") {
    return Response.json({ error: "A seller address is required." }, { status: 400 });
  }

  const seller = (body as { seller: string }).seller;
  if (!isAddress(seller)) return Response.json({ error: "A valid seller address is required." }, { status: 400 });

  try {
    return Response.json(await createDemoAttestation(seller), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AttesterNotConfiguredError) {
      return Response.json({ error: "The demo attester is not configured." }, { status: 503 });
    }
    return Response.json({ error: "The demo attestation could not be created." }, { status: 500 });
  }
}
