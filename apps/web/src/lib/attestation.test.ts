import assert from "node:assert/strict";
import { test } from "node:test";

import { createHash } from "node:crypto";

import { privateKeyToAccount } from "viem/accounts";

import { attestationDigest, signAttestation } from "./server/attestation.ts";

const FIXTURE_PRIVATE_KEY = `0x${"01".padStart(64, "0")}` as const;
const SELLER = "0xF779D59bEf219cAeB6C8e3F4bfCdf3aB7DE52Be3";
const ATTESTED_AT = 1_800_000_000;

test("attestation digest uses packed address and two big-endian uint64 values", () => {
  const message = Buffer.concat([
    Buffer.from(SELLER.slice(2).toLowerCase(), "hex"),
    Buffer.from("000000000aba9500", "hex"), // 180,000,000
    Buffer.from("000000006b49d200", "hex"), // 1,800,000,000
  ]);
  const expected = `0x${createHash("sha256").update(message).digest("hex")}`;
  assert.equal(attestationDigest(SELLER.toLowerCase() as `0x${string}`, 180_000_000n, BigInt(ATTESTED_AT)), expected);
});

test("attester signs the raw digest and returns low-s r||s", async () => {
  const account = privateKeyToAccount(FIXTURE_PRIVATE_KEY);
  const result = await signAttestation(SELLER, FIXTURE_PRIVATE_KEY, ATTESTED_AT);
  const digest = attestationDigest(SELLER.toLowerCase() as `0x${string}`, 180_000_000n, BigInt(ATTESTED_AT));
  const expected = await account.sign({ hash: digest });
  const signature = BigInt(`0x${result.signature.slice(66)}`);

  assert.equal(result.signature.length, 130);
  assert.equal(result.signature.slice(2, 66), expected.slice(2, 66));
  assert(signature > 0n && signature <= 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n);
  assert.equal(result.seller, SELLER.toLowerCase());
  assert.equal(result.revenue, 180_000_000);
  assert.equal(result.attestedAt, ATTESTED_AT);
});
