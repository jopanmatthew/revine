# Run the Revine demo

Revine is a prototype for helping Indonesian small businesses receive early payment for buyer-confirmed invoices. This guide explains how to run the sample app and what to know before using the Sepolia demo.

## Local sample app

You need Node.js 20.9 or newer.

```bash
cd apps/web
npm ci
cp -n .env.example .env.local
npm run dev
```

Visit <http://localhost:3000>. The example environment runs in mock mode, so it does not need a wallet, test ETH, or API keys. It uses sample data and simulated transactions.

To run the project's checks from `apps/web`:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

The Solidity project uses Foundry. From `contracts/`, run `forge test` after installing the pinned dependencies described in [contracts/README.md](contracts/README.md).

## Public demo

Open [revine-azure.vercel.app/app](https://revine-azure.vercel.app/app). The app connects to Ethereum Sepolia and uses test mIDR. It does not involve real money.

The deployed `RevineInvoice` contract points to `AlwaysTrueVerifier`. That placeholder accepts any proof, so the public deployment does not perform real zero-knowledge verification. Keep proof mode off unless matching real verifiers and a new invoice contract are deployed and configured.

The sample Demo Bank credit attestation is synthetic; it is not evidence from a real bank. A complete three-wallet live transaction walkthrough has not been confirmed, so treat the public deployment as a prototype for review and testing.

## Optional Sepolia development

To use real Sepolia contract calls locally, copy `apps/web/.env.example` to `apps/web/.env.local`, set `NEXT_PUBLIC_USE_MOCKS=false`, and provide the public RPC and wallet connection settings. Configure the contract addresses for the deployment you intend to use. Restart the dev server after changing `NEXT_PUBLIC_` values.

The existing public addresses are listed in the root [README](README.md). They are not production contracts. The current invoice contract uses the proof-accepting placeholder described above. For a future deployment with real proof checks, see the [Remix guide](contracts/remix/README.md).

Server-only Supabase and attestation values in `.env.example` are optional for the local mock. Keep service-role credentials and attester secrets on the server; never add a `NEXT_PUBLIC_` prefix to them. Never paste, upload, or commit a wallet private key. Use MetaMask to sign wallet transactions.

## What is public and what is private

The blockchain publicly records wallet addresses, invoice and offer amounts, due dates, status changes, token ownership, and settlement events. Invoice descriptions and line items are stored off-chain and shared through the app with the seller and buyer. The app's backend can access those details; they are not end-to-end encrypted.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a plain-language explanation of the product flow and its current limits.
