# revine. setup and readiness

This guide covers the Sepolia demo. The public app is live at
<https://revine-azure.vercel.app>. MetaMask signs transactions in the browser;
no wallet private key belongs in a file, terminal command, website, or chat.

## Current state (9 Oct 2026)

| Area | State |
|---|---|
| App | Real MetaMask connection and Sepolia hooks are implemented. Mocks can be disabled locally. |
| Production build | `NEXT_PUBLIC_USE_MOCKS=false npm run build` passes. |
| Invoice details | Migration was applied on 9 Oct 2026; local app logs then showed successful private-detail writes and reads (`/api/details` 200). |
| Proofs | Invoice and credit circuits, browser prover, generated EVM verifiers and Solidity integration tests are implemented locally. The real verifiers are not yet on Sepolia. |
| Credit evidence | `/api/attest` signs synthetic Demo Bank revenue for this demo; it is not connected to a real bank. |
| Sepolia | The current `RevineInvoice` still uses `AlwaysTrueVerifier`; proof mode must stay off until deploying the verifiers and a replacement invoice contract. |
| End-to-end flow | The funded three-wallet MetaMask flow still needs to be run manually. |
| Public site | Live on Vercel at <https://revine-azure.vercel.app>. |

**Run order:** fund the wallets and finish the M1 flow
against the current fingerprint-only Sepolia deployment first. Then deploy the
two real proof verifiers and a replacement `RevineInvoice`, update the local
addresses, enable proof mode, and run M2/M3. The new invoice contract requires
real proofs, so the M1 `0x` proof path must not be used after switching to it.

Current deployed contracts:

| Contract | Address |
|---|---|
| MockIDR | `0xf00642cb8069acd00707ccdaa1d0bac5af9828bf` |
| AlwaysTrueVerifier | `0xf958ff6652ae2f277074ba86f278c2cc0ef1b756` |
| RevineInvoice (fingerprint-only) | `0x70ac14f38dac3a56d87ec18b604c61cb9471a59d` |

## 1. Supabase migration (already applied to the current project)

The current project has the table. These steps are for a fresh Supabase project
or if the migration needs to be reapplied.

1. Open the Supabase project used by `SUPABASE_URL` in `apps/web/.env.local`.
2. Open **SQL Editor**, create a query, and paste the full contents of
   `supabase/migrations/202610090001_invoice_details.sql`.
3. Click **Run**. The query creates `public.invoice_details`, enables RLS,
   removes access from `anon` and `authenticated`, and grants the server role
   the required access.
4. Confirm the app's `/api/details` route can save and read private invoice
   details with seller/buyer wallet signatures.

The local `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never rename it with a
`NEXT_PUBLIC_` prefix. Supabase publishable/anon keys cannot replace it.

## 2. Deploy the real proof contracts with Remix and MetaMask

The new generated verifier source files are in `contracts/remix/`. Keep the
existing MockIDR token so wallets retain their mIDR. Do not deploy
`AlwaysTrueVerifier` for proof mode.

1. Open <https://remix.ethereum.org/> and upload these files from
   `contracts/remix/`:
   - `InvoiceVerifier.sol`
   - `CreditVerifier.sol`
   - `RevineInvoice.sol`
2. In **Solidity Compiler**, choose `0.8.30`, turn optimization on, and set
   optimizer runs to `200`. Compile each file. The two generated verifier
   sources each define `HonkVerifier`; deploy the `HonkVerifier` shown under
   that source file in Remix.
3. In **Deploy & Run**, choose **Browser Extension**, connect MetaMask, and
   confirm the selected network is **Sepolia**.
4. Deploy `HonkVerifier` from `InvoiceVerifier.sol`. Confirm in MetaMask and
   record its address.
5. Deploy `HonkVerifier` from `CreditVerifier.sol`. Confirm in MetaMask and
   record its address.
6. Deploy `RevineInvoice`. Its constructor fields, in order, are:
   - existing MockIDR: `0xf00642cb8069acd00707ccdaa1d0bac5af9828bf`
   - invoice verifier address from step 4
   - credit verifier address from step 5
7. Confirm the deployment in MetaMask. Record the new invoice address and its
   deployment block from the transaction on Sepolia Etherscan.
8. Put those public values in `apps/web/.env.local`:

   ```dotenv
   NEXT_PUBLIC_MOCK_IDR_ADDRESS=0xf00642cb8069acd00707ccdaa1d0bac5af9828bf
   NEXT_PUBLIC_REVINE_INVOICE_ADDRESS=<new RevineInvoice address>
   NEXT_PUBLIC_DEPLOYMENT_BLOCK=<new deployment block number>
   NEXT_PUBLIC_USE_MOCKS=false
   NEXT_PUBLIC_ZK_PROOFS_ENABLED=true
   ```

   Restart the dev server after changing `NEXT_PUBLIC_` values. These are
   public addresses and flags; do not put any private key in this file.

`contracts/remix/README.md` has the deployment sequence in short form. The
generated verifiers are tied to the checked-in circuit artifacts. If either
circuit changes, regenerate the artifacts and verifier sources before
deploying again.

## 3. Fund the three demo wallets

Use separate MetaMask profiles (or separate browser profiles) for each role.
Confirm Ethereum Sepolia is selected in every profile.

| Role | Address |
|---|---|
| Seller — Beras Bu Sari | `0xF779D59bEf219cAeB6C8e3F4bfCdf3aB7DE52Be3` |
| Buyer — RM Selera Kita | `0x28a3A19dC9Bbea5895185e21796EC1732cAf557F` |
| Financier — Modal Maju | `0x9a32Ffa2597987D3f0EDB111Eff598E4110B7ff8` |

For each wallet:

1. Use the [Alchemy Sepolia faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   to reach at least `0.2 Sepolia ETH` for gas.
2. Connect that wallet to the local app and use **Get test mIDR** in the balance
   menu. Confirm the `faucet()` transaction in MetaMask. It mints 100,000,000
   test mIDR to that wallet.

Do not send funds to an address based only on its role label; confirm the full
address shown in MetaMask matches this table.

## 4. Run the local real-mode flow

1. Set `NEXT_PUBLIC_USE_MOCKS=false` in `apps/web/.env.local`. Keep
   `NEXT_PUBLIC_ZK_PROOFS_ENABLED=false` until the new proof contracts are
   deployed and their addresses are configured.
2. Start the local app:

   ```bash
   cd apps/web
   npm run dev
   ```

3. Open `http://localhost:3000`. In three browser profiles, connect the seller,
   buyer, and financier MetaMask accounts in that order.
4. Complete seller creates invoice → buyer confirms → seller lists → financier
   buys → buyer repays. Confirm each transaction in MetaMask and check its
   Sepolia Etherscan link.
5. After proof contracts are deployed, configure the addresses and enable
   `NEXT_PUBLIC_ZK_PROOFS_ENABLED=true`. Repeat invoice creation and publish a
   credit badge; confirm both actions succeed and the revenue amount remains
   private.

The local `/api/attest` endpoint uses synthetic demo revenue. Present it as a
demo attestation, not as bank-connected credit data.

## 5. Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local`. It includes public
contract address overrides and these server-only values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ATTESTER_PRIVATE_KEY` — dedicated synthetic Demo Bank signer only; never a
  MetaMask wallet key

Keep the file ignored by Git. Alchemy RPC and WalletConnect values are also
documented in the example. The build-time `NEXT_PUBLIC_` flags and addresses
are embedded in the browser bundle, so restart/rebuild after changing them.

## 6. Regenerate proof artifacts after circuit edits

`nargo` is pinned at `1.0.0-rc.4` in `circuits/NARGO_VERSION`; the JavaScript
prover packages are exact-pinned in `apps/web/package.json`. From the web app
directory:

```bash
npm run build:circuits
npm run build:verifiers
```

This compiles both Noir circuits and copies their JSON artifacts to
`apps/web/public/circuits/`, then generates EVM-targeted verifier sources into
`contracts/src/verifiers/` and `contracts/remix/`. The first verifier build
needs network access to fetch the Barretenberg CRS. Refresh the Solidity
integration proof fixtures and rerun Foundry tests before deploying changed
circuits.

## 7. Public deployment

The public Sepolia demo is live at <https://revine-azure.vercel.app>. Its
production Vercel environment uses the current Supabase demo project and the
server-only synthetic Demo Bank signer. Mocks are off and ZK proof mode is off.
The current `RevineInvoice` still points to `AlwaysTrueVerifier`, so the
deployment is a test demo and must not be used with real funds. The funded
three-wallet flow still needs a manual run.

To promote beyond this demo, deploy the real invoice and credit verifiers,
configure the replacement invoice contract addresses, and verify the complete
flow. Never add a wallet private key to Vercel or the app.
