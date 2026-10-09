import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";

import { fingerprint, invoiceCircuitFingerprint, textHash } from "./fingerprint.ts";

const invoice = {
  seller: "0x1111111111111111111111111111111111111111" as const,
  buyer: "0x2222222222222222222222222222222222222222" as const,
  faceAmount: 100_000,
  dueDate: 1_900_000_000,
  items: [{ name: "Rice", qty: 2, unitPrice: 50_000 }],
  description: "May delivery",
  salt: `0x00${"ab".repeat(31)}` as `0x${string}`,
};

const nativeFetch = globalThis.fetch;
const invoiceCircuit = readFileSync(new URL("../../public/circuits/invoice.json", import.meta.url), "utf8");
globalThis.fetch = async (input, init) => {
  const path = typeof input === "string" ? input : input instanceof URL ? input.pathname : "";
  if (path === "/circuits/invoice.json") return new Response(invoiceCircuit, { status: 200 });
  return nativeFetch(input, init);
};
after(() => {
  globalThis.fetch = nativeFetch;
});

test("textHash is stable for the fixed description then itemNames key order", async () => {
  const first = await textHash({ description: "May delivery", itemNames: ["Rice"] });
  const second = await textHash({ itemNames: ["Rice"], description: "May delivery" });
  assert.equal(first, second);
  assert.equal((first.length - 2) / 2, 32);
  assert.equal(first.slice(2, 4), "00");
});

test("the seller and buyer compute the same light-mode fingerprint", async () => {
  assert.equal(await fingerprint(invoice), await fingerprint({ ...invoice }));
});

test("the Noir circuit computes a separate proof-mode commitment", async () => {
  const first = await invoiceCircuitFingerprint(invoice);
  const second = await invoiceCircuitFingerprint({ ...invoice });
  assert.match(first, /^0x[0-9a-f]{64}$/);
  assert.equal(second, first);
  assert.notEqual(first, await fingerprint(invoice));
});

test("changing any committed invoice input changes the fingerprint", async () => {
  const base = await fingerprint(invoice);
  const changes = [
    { ...invoice, seller: "0x3333333333333333333333333333333333333333" as const },
    { ...invoice, buyer: "0x4444444444444444444444444444444444444444" as const },
    { ...invoice, faceAmount: invoice.faceAmount + 1 },
    { ...invoice, dueDate: invoice.dueDate + 1 },
    { ...invoice, items: [{ name: "Rice", qty: 3, unitPrice: 50_000 }] },
    { ...invoice, items: [{ name: "Rice", qty: 2, unitPrice: 50_001 }] },
    { ...invoice, items: [{ name: "Brown rice", qty: 2, unitPrice: 50_000 }] },
    { ...invoice, description: "June delivery" },
    { ...invoice, salt: `0x00${"cd".repeat(31)}` as `0x${string}` },
  ];

  for (const changed of changes) assert.notEqual(await fingerprint(changed), base);
});
