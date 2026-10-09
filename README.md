# revine.

Invoice financing for Indonesian SMEs. A seller creates an invoice, the buyer
confirms it, and a financier can fund it before the buyer repays the current
holder. The web app is built with Next.js; the contract demo runs on Sepolia.

## Run locally

```bash
cd apps/web
npm install
npm run dev
```

Open <http://localhost:3000>. Mock mode is controlled by `apps/web/.env.local`.
See [SETUP.md](SETUP.md) for the real Sepolia setup. Never put a MetaMask
private key in the app or share it in chat.

## Current Sepolia contracts

Network: Ethereum Sepolia (`11155111`).

| Contract | Address | Explorer |
|---|---|---|
| MockIDR | `0xf00642cb8069acd00707ccdaa1d0bac5af9828bf` | [View](https://sepolia.etherscan.io/address/0xf00642cb8069acd00707ccdaa1d0bac5af9828bf) |
| AlwaysTrueVerifier | `0xf958ff6652ae2f277074ba86f278c2cc0ef1b756` | [View](https://sepolia.etherscan.io/address/0xf958ff6652ae2f277074ba86f278c2cc0ef1b756) |
| RevineInvoice | `0x70ac14f38dac3a56d87ec18b604c61cb9471a59d` | [View](https://sepolia.etherscan.io/address/0x70ac14f38dac3a56d87ec18b604c61cb9471a59d) |

That invoice deployment still points to `AlwaysTrueVerifier`; it is a
fingerprint-only test deployment and accepts any proof. The app's real proof
mode remains off until the generated invoice and credit verifiers and a new
`RevineInvoice` are deployed and configured. Do not use these test contracts
with real funds.

## Readiness

- Real MetaMask connection and Sepolia contract hooks are implemented.
- The Supabase migration was applied on 9 Oct 2026. Afterward, the local app
  logged successful private invoice-detail writes and reads (`/api/details` 200).
- Invoice and credit Noir circuits, browser proving, generated Solidity
  verifiers, and local verifier integration are implemented. Credit revenue is
  synthetic demo data, not bank evidence. The verifiers are not deployed yet.
- The production build, frontend checks, circuit tests, and Foundry verifier
  integration tests pass locally. See [SETUP.md](SETUP.md) for the exact state
  and remaining MetaMask steps.
- The three-wallet Sepolia flow still needs funded accounts and a manual run.
- Public demo is live at <https://revine-azure.vercel.app>. It uses Sepolia;
  proof mode is off, the current invoice contract is fingerprint-only, and the
  Demo Bank attestation uses synthetic data.

## Local checks

```bash
cd apps/web
npm test
npm run lint
npx tsc --noEmit
NEXT_PUBLIC_USE_MOCKS=false npm run build

cd ../../contracts
forge test
```

See [PRD.md](PRD.md) for product requirements and [PRD-day2.md](PRD-day2.md)
for implementation status.
