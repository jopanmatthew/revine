"use client";

import type { CompiledCircuit, InputMap } from "@noir-lang/noir_js";
import { toHex, type Hex } from "viem";

type CircuitName = "invoice" | "credit";

interface Execution {
  circuit: CompiledCircuit;
  witness: Uint8Array;
  returnValue: unknown;
}

export interface ProofResult {
  proof: Hex;
  publicInputs: Hex[];
  returnValue: unknown;
}

const circuits = new Map<CircuitName, Promise<CompiledCircuit>>();

async function loadCircuit(name: CircuitName): Promise<CompiledCircuit> {
  let cached = circuits.get(name);
  if (!cached) {
    cached = fetch(`/circuits/${name}.json`, { cache: "force-cache" }).then(async (response) => {
      if (!response.ok) throw new Error(`The ${name} proof circuit could not be loaded.`);
      return (await response.json()) as CompiledCircuit;
    });
    circuits.set(name, cached);
  }
  return cached;
}

async function execute(name: CircuitName, inputs: InputMap): Promise<Execution> {
  const [{ Noir }, circuit] = await Promise.all([import("@noir-lang/noir_js"), loadCircuit(name)]);
  const program = new Noir(circuit);
  const result = await program.execute(inputs);
  return { circuit, witness: result.witness, returnValue: result.returnValue };
}

export async function executeInvoiceCircuit(inputs: InputMap): Promise<unknown> {
  const result = await execute("invoice", inputs);
  return result.returnValue;
}

export async function proveCircuit(name: CircuitName, inputs: InputMap): Promise<ProofResult> {
  const execution = await execute(name, inputs);
  const { Barretenberg, UltraHonkBackend } = await import("@aztec/bb.js");
  const api = await Barretenberg.new({ threads: 1 });
  try {
    const backend = new UltraHonkBackend(execution.circuit.bytecode, api);
    const result = await backend.generateProof(execution.witness, { verifierTarget: "evm" });
    const valid = await backend.verifyProof(result, { verifierTarget: "evm" });
    if (!valid) throw new Error("The generated privacy proof did not verify locally.");
    return {
      proof: toHex(result.proof),
      publicInputs: result.publicInputs as Hex[],
      returnValue: execution.returnValue,
    };
  } finally {
    await api.destroy();
  }
}
