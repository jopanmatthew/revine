import { Barretenberg, UltraHonkBackend } from "../apps/web/node_modules/@aztec/bb.js/dest/node/index.js";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const verifierTarget = "evm";
const api = await Barretenberg.new({ threads: 1 });

try {
  for (const name of ["invoice", "credit"]) {
    const artifactPath = resolve(root, "apps/web/public/circuits", `${name}.json`);
    const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
    if (typeof artifact.bytecode !== "string") {
      throw new Error(`Circuit artifact has no bytecode: ${artifactPath}`);
    }

    const backend = new UltraHonkBackend(artifact.bytecode, api);
    const verificationKey = await backend.getVerificationKey({ verifierTarget });
    const solidity = await backend.getSolidityVerifier(verificationKey, { verifierTarget });
    const title = name[0].toUpperCase() + name.slice(1);
    const outputs = [
      resolve(root, "contracts/src/verifiers", `${title}Verifier.sol`),
      resolve(root, "contracts/remix", `${title}Verifier.sol`),
    ];
    await Promise.all(outputs.map((path) => writeFile(path, solidity)));
    console.log(`Generated ${title}Verifier.sol from ${artifactPath}`);
  }
} finally {
  await api.destroy();
}
