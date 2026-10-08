# revine. — Day 2 PRD

**For:** 10 Oct 2026 · **Release:** v26.0 · **Network:** Ethereum Sepolia · **Event:** ETHJKT

This is the plan for day 2. It sits next to `PRD.md`, which stays the source of truth for *what* we build (screens, contracts, circuits, copy). This file says *what's left, who does it, in what order, and how we know it's done*. If the two disagree, PRD.md wins: stop, ask, and fix PRD.md §22–23 first (CLAUDE.md rule).

---

## Contents

1. Where we are after day 1
2. Goal for day 2
3. Schedule, milestones and cut rules
4. Workstreams and tasks
5. The interface contract (don't break it)
6. What changed on day 1 (read if you missed it)
7. Codebase gotchas
8. Decisions to make in the first 30 minutes
9. End-of-day checklist
10. Kickoff prompts for Claude Code / Cursor

---

## 1. Where we are after day 1

### 1.1 Done

| Area | State |
|---|---|
| **Frontend, every screen in §9** | Built and working on mock data: landing, role picker, seller dashboard, create invoice, get financed, credit badge, buyer dashboard, financier marketplace + portfolio, invoice detail. |
| **Landing (§9.2)** | Redesigned, Pluang-inspired: centered hero with a coded product stage (financier buys invoice #12, the seller's phone shows "You got paid Rp9.700.000 🎉"), example calculator, tabbed How it works, "one invoice, three views", privacy redaction, footer CTA. |
| **App look (§9.1)** | Dark `brand-900` header that runs into each screen's cover band; pill buttons and tabs; white sheets that overlap the band; floating action sheets. |
| **Extras added on day 1** | Buyer payment record (§7, §9.9, §9.10), Companies tab with closed-invoice records and labelled profile ads (§7, §9.9, mock-only), landing calculator. All in PRD §6.1 now. |
| **Shared plumbing** | `types.ts` (§16.1), hook signatures (§16.2) with mock implementations, `mock.ts` + simulated contract (`mock-actions.ts`), TxStepper, friendly errors (§11), format helpers, demo names, `.env.example`. |
| **Quality** | `tsc`, `eslint`, 15 unit tests (`npm test`) and `npm run build` pass. Checked at 375px and 1024px. |
| **PRD** | PRD.md matches the build (end-of-day-1 cleanup, §23). |

### 1.2 Not started

| Area | Owner (PRD §17.1) | PRD |
|---|---|---|
| Contracts: `MockIDR`, `RevineInvoice`, verifiers, Foundry tests, deploy, Etherscan verification | Jovan | §13, §18.1 |
| `src/lib/contracts.ts` (addresses + ABIs) | Jovan | §16.4 |
| Wallet: wagmi + viem + RainbowKit + TanStack Query | Jovan | §12.2 |
| Real hooks: every `TODO(Jovan)` in `src/lib/hooks/` | Jovan | §16.2 |
| Supabase table + `/api/details` + wallet verification | Jovan | §15 |
| `/api/attest` (mock attester) | Jovan | §15.2 |
| `src/lib/fingerprint.ts` (light-mode fingerprint + `text_hash`) | open | §14.2 |
| Noir circuits: credit (P1), invoice (P2) | open (§21: proposed Jovan) | §14 |
| Browser prover `src/zk/prover.ts` | Frontend dev | §14, §12.5 |
| Vercel deployment | Frontend dev | §12.2 |
| Logo SVGs, favicon, apple icon, OG image (`public/brand/` is empty; the logo is a text stand-in) | Designer | §10.1 |
| `README.md`, deck, demo video | Pitch lead | §17.1 |
| `.cursor/rules/revine.mdc` (Appendix A) | anyone | App. A |

### 1.3 Repo state (important)

- On GitHub: **https://github.com/TimTam32123/revine** (private). Default branch `main` has all of day 1 (`2cc8629`). `frontend-foundation` is the same snapshot and can be deleted.
- Teammates need to be added as collaborators (repo Settings → Collaborators) before they can clone it.
- `.impeccable/review/` (about 4 MB of screenshots) is gitignored.
- `DESIGN.md` describes the old (pre-redesign) look and is stale. `PRODUCT.md` is current.

### 1.4 Run it

```bash
cd ~/revine/apps/web
npm install
npm run dev        # http://localhost:3000, mock mode via .env.local
npm test           # unit tests (node --test)
npm run lint
npm run build
```

In mock mode, the account menu (top right) switches between Beras Bu Sari, RM Selera Kita, Modal Maju and an empty wallet. It also has "Reset demo data" and "Load worst-case data".

---

## 2. Goal for day 2

**Ship v26.0 "done" (PRD §5) on the deployed Vercel URL.** In order:

| Milestone | What's true | PRD |
|---|---|---|
| **M1 — core flow on Sepolia** | Three wallets in three browser profiles run create → confirm → list → buy → repay on the Vercel URL with real contracts. Balances end exactly right: seller +Rp9.700.000, financier −Rp9.700.000 then +Rp10.000.000, buyer −Rp10.000.000. Every action shows wallet → pending → success or a §11 error, with an Etherscan link. | §5.1–5.2, §6.1 P0 |
| **M2 — credit badge (P1)** | The seller proves "revenue above Rp100 jt" in the browser; `submitCreditProof` verifies on-chain; the badge shows on the marketplace and invoice page; nobody sees the number. | §5.6, §14.3 |
| **M3 — invoice proof (P2)** | The invoice proof verifies on-chain at creation; the buyer's review shows "Details match the on-chain fingerprint ✓" from `noir.execute`. | §5.7, §14.2 |
| **Ship** | Contracts verified on Etherscan, mocks off on Vercel, brand assets in, README + demo video ready, submission sent. | §5.5, §5.9–5.10, §18.4 |

P3 (§6.1) only if M1–M3 are done. Nothing from §6.2.

---

## 3. Schedule, milestones and cut rules

T0 = when we start. Shift the blocks to fit the real submission deadline, but keep the order and the gates.

| Block | Jovan | Frontend dev | Designer | Pitch lead |
|---|---|---|---|---|
| **T0 – 0:30** | Everyone: §8 decisions, commit + push day 1, create the GitHub repo, Vercel project, Supabase project, WalletConnect ID, Alchemy key | ← | ← | ← |
| **0:30 – 2:30** | Foundry project; `MockIDR`, `RevineInvoice`, `AlwaysTrueVerifier`; tests for every case in §18.1 | Deploy the **mock** build to Vercel; install wallet stack + providers + styled connect button (§4.3); `fingerprint.ts` + tests; hello-world Noir proof running **on the Vercel URL** (§12.5 #4) | Logo SVGs, favicon, apple icon, OG image (§10.1); confirm the mint hex (§21.5) | README draft; deck outline with day-1 screenshots |
| **2:30 – 4:30** | Deploy to Sepolia + verify; `contracts.ts`; read hooks, then action hooks | Supabase table + `/api/details` + wallet verification (§15), if §8 moves it to frontend; switch `USE_MOCKS=false` locally and test each screen | Swap the text logo for the SVGs; QA pass on real data | Problem + market slides |
| **Gate M1 ≈ 4:30** | **Full core flow on the Vercel URL, three wallets.** | | | |
| **4:30 – 7:00** | `/api/attest`; credit circuit + `nargo test` with a real attester signature; `CreditVerifier`; redeploy | `src/zk/prover.ts` (noir_js + bb.js, keccak/EVM proofs); wire the credit page and `publishCreditBadge` | Badge + proof visuals for the deck | Privacy + ZK slides |
| **Gate M2 ≈ 7:00** | **Credit badge verified on-chain from the Vercel URL.** | | | |
| **7:00 – 9:00** | Invoice circuit + `InvoiceVerifier`; redeploy | Proof on create (`proving` step); buyer check via `noir.execute` | QA | Rehearse the demo script (§19) |
| **Gate M3 ≈ 9:00** | **Invoice proof verified on-chain at creation.** | | | |
| **9:00 – 10:00** | Seed demo data (one invoice per status), fund wallets, final Etherscan verification (§18.4) | Mobile pass in real mode; copy check against §10–11; `USE_MOCKS=false` and `DEMO_MODE=true` on Vercel | QA | Record the backup demo video |
| **10:00 – end** | **Freeze: bug fixes only.** | Freeze | — | Final video, README, submission |

**Cut rules**

- M1 not done by its gate → everyone helps on M1. Nothing else starts.
- M2 not done by its gate → stop new ZK work, polish P0 + P1, present P2 as roadmap.
- Without a verified proof, the UI and pitch say "fingerprint", never "proof" (§14.2 light mode).
- Anything that doesn't work is **hidden**, not shown disabled (§5.8).

---

## 4. Workstreams and tasks

Each task lists its PRD section, files and acceptance check. Tick the boxes in the PR description.

### 4.1 Repo and hygiene (everyone, first 30 minutes)

- [x] Add `.impeccable/review/` to `.gitignore`.
- [ ] Decide `DESIGN.md`: regenerate it from the current code, or delete it (it describes the old look).
- [x] Commit the day-1 work and push it to GitHub (`main`, private).
- [ ] Add teammates as collaborators; everyone clones: `git clone https://github.com/TimTam32123/revine.git`.
- [ ] From now on: one branch per workstream (`contracts`, `wallet-hooks`, `api-details`, `zk-credit`…), PR into `main`, merge when `npm run build` passes.
- [ ] Add `.cursor/rules/revine.mdc` from Appendix A.
- [ ] Before making the repo public: read `apps/web/src/fonts/Satoshi-LICENSE.txt` (self-hosted font files in a public repo), then set `GITHUB_URL` in `src/lib/config.ts`.
- [ ] Everyone pulls and runs `npm install && npm run dev` once.

### 4.2 Contracts (Jovan) — PRD §13, §18.1

- [ ] Foundry project in `contracts/` with OpenZeppelin v5 (§12.3 layout).
- [ ] `MockIDR` (decimals 0, `faucet()` mints 100.000.000), `RevineInvoice` (ERC-721 "revine. Invoice", RVI), `AlwaysTrueVerifier`.
- [ ] Every function, view, event and custom error in §13.3; every rule in §13.4. In particular: `_update` blocks transfers when `auth != address(0)`; the contract builds public inputs itself; state changes before token transfers; verifier calls wrapped in try/catch.
- [ ] `getInvoices(offset, limit)` returns `InvoiceView` with `id` and `holder` (the frontend loads everything in one call).
- [ ] Tests: every case in §18.1, including final balances and holder after each step.
- [ ] `script/Deploy.s.sol`: MockIDR → verifiers → RevineInvoice; mint Rp100.000.000 to each demo wallet; print addresses.
- [ ] Deploy to Sepolia; verify all contracts on Etherscan.
- [ ] `apps/web/src/lib/contracts.ts`: addresses, ABIs `as const`, deployment block (§16.4).
- [ ] Put the real demo wallet addresses in `src/lib/demo-names.ts` (`DEMO_WALLETS`, currently placeholders).

**Done when:** `forge test` is green, contracts are verified on Etherscan, and `contracts.ts` is merged.

### 4.3 Wallet and real hooks (Jovan; frontend pairs on the UI parts) — PRD §16.2

Install: `wagmi`, `viem`, `@rainbow-me/rainbowkit`, `@tanstack/react-query`.

- [ ] A client `Providers` component (wagmi config for Sepolia with `NEXT_PUBLIC_RPC_URL`, RainbowKit, QueryClient) wrapping the app in `src/app/layout.tsx`.
- [ ] `WalletButton` (`src/components/wallet-button.tsx`): use RainbowKit's `ConnectButton.Custom` so it keeps the dark-header pill look (same classes as the mock button). Keep the mock button for `USE_MOCKS=true`.
- [ ] Replace each `TODO(Jovan)` with the real version. The mock and real versions sit in the same file and switch on `USE_MOCKS`:

| Hook | File | Real version |
|---|---|---|
| `useWallet` | `use-wallet.ts` | `useAccount` + `useSwitchChain`; `isWrongNetwork` = connected and `chainId !== 11155111`; `isConnecting` covers reconnect on page load |
| `useInvoices` / `useInvoice` | `use-invoices.ts` | `invoiceCount` then `getInvoices(0, count)`; poll every 10 s while the tab is visible; refetch after every successful action; unknown id → `invoice: null` |
| `useBalances` | `use-balances.ts` | MockIDR `balanceOf` + Sepolia ETH balance; refetch after transactions |
| `useCreditBadge` | `use-credit-badge.ts` | `creditBadge(address)`; `isValid = verifiedAt > 0 && now − attestedAt ≤ 30 days` |
| `useInvoiceDetails` | `use-invoice-details.ts` | wallet verification (§15.3) → `GET /api/details` → fingerprint check (§14.2) |
| `useRevineActions` | `use-revine-actions.ts` | `writeContract` + `waitForTransactionReceipt`; approval only when allowance is short; read the new id from `InvoiceCreated`; map custom errors to §11 messages |
| `useProfileAds` | `use-profile-ads.ts` | stays empty in real mode for v26.0 (ads are off-chain and mock-only) |

**Done when:** with `NEXT_PUBLIC_USE_MOCKS=false`, every screen works against Sepolia **without changing any component** (§16.3).

### 4.4 Off-chain data and fingerprint — PRD §14.2, §15

- [ ] Supabase table `invoice_details` (§15.1). RLS **on**, **no policies**. The service-role key is server-only.
- [ ] `POST /api/details` and `GET /api/details?commitment=0x…` with the checks in §15.2.
- [ ] Wallet verification message and checks exactly as §15.3 (viem `verifyMessage`; ≤ 24 h old; ≤ 5 min in the future). The client keeps `{ message, signature }` per address in session storage.
- [ ] `src/lib/fingerprint.ts`: `textHash({ description, itemNames })` = first 31 bytes of SHA-256 of `JSON.stringify` with that key order; light-mode `fingerprint(...)` = `keccak256(abi.encode(seller, buyer, faceAmount, dueDate, qty[5], unitPrice[5], textHash, salt))`. Unit tests: the same input gives the same hash for seller and buyer; any change gives a different one.
- [ ] `createInvoice` real flow: `verify-wallet` → (`proving` in P2) → `saving-details` (POST) → `wallet` → `pending` → `success`.

**Done when:** the buyer opens a real invoice, signs once, sees the line items, and sees "Details match the on-chain fingerprint ✓"; a third wallet sees only the locked message.

### 4.5 Deploy (frontend dev) — PRD §12.2, §12.4

- [ ] Vercel project, root directory `apps/web`.
- [ ] Env vars from `.env.example`. Mock build first (`USE_MOCKS=true`), real build once M1 passes locally.
- [ ] A hello-world Noir proof runs **on the Vercel URL**, not just localhost (§12.5 #4).
- [ ] Don't add COOP/COEP headers unless single-threaded proving is too slow (§12.5 #5).

### 4.6 ZK credit badge, P1 (circuit: owner from §8; prover: frontend dev) — PRD §14.3, §9.7

- [ ] Pin nargo, bb, `@noir-lang/noir_js`, `@aztec/bb.js` to compatible versions and write them in PRD §22.
- [ ] `/api/attest`: `DEMO_REVENUE` map (demo seller → 180.000.000, others → 120.000.000); signs the **raw 32-byte digest**, 64-byte r‖s, low-s (§12.5 #11).
- [ ] `circuits/credit`: constraints in §14.3, plus one `nargo test` using a signature produced by the real `/api/attest` code.
- [ ] `CreditVerifier.sol` from bb with the keccak/EVM option; redeploy `RevineInvoice`; update `contracts.ts`.
- [ ] `src/zk/prover.ts`: client-only dynamic import; EVM-compatible proofs.
- [ ] `getAttestation` + `publishCreditBadge` in `useRevineActions`. The credit page UI already exists (`/seller/credit`).

**Done when:** the demo seller publishes "Revenue above Rp100 jt" from the Vercel URL, it shows on marketplace cards and the invoice page, and Etherscan shows the `CreditVerified` event.

### 4.7 ZK invoice proof, P2 — PRD §14.2

- [ ] `circuits/invoice` with the constraints in §14.2 and the `nargo test` cases in §18.2.
- [ ] `InvoiceVerifier.sol`; redeploy; update `contracts.ts`.
- [ ] Seller: proof generated on create (`proving` step), passed to `createInvoice`.
- [ ] Buyer: `noir.execute(...)` (witness only) and compare with the on-chain commitment; a failure counts as a mismatch.
- [ ] Invoice page: "Invoice proof" fact says "Verified on-chain at creation ✓" (§9.10).

### 4.8 Brand assets (designer) — PRD §10.1

- [ ] Export into `apps/web/public/brand/`: `logo-horizontal-light.svg`, `logo-horizontal-dark.svg`, `mark.svg`, `mark-flat.svg`.
- [ ] `favicon.ico`, `apple-icon.png`, `og-image.png` (mark on a `brand-900` rounded square). There's no favicon yet.
- [ ] Swap `src/components/logo.tsx` (text stand-in) for the SVGs. The header, landing hero and footer use the dark version now.
- [ ] Confirm the accent hex (§21.5); the code uses `#35CB9B`.

### 4.9 Pitch (pitch lead) — PRD §19, §20

- [ ] `README.md`: what revine. is, the live URL, how to run locally, contract addresses + Etherscan links, the ZK story, team, the "honest answers" from §20.
- [ ] Deck: problem, demo, how it works, privacy/ZK, business model (fee from §21.3), roadmap.
- [ ] Rehearse the §19 demo script (updated on 9 Oct for the landing stage and the buyer payment record) and fix the timings. Optional beat: the Companies tab, if there's time.
- [ ] If we show profile ads in the pitch, say they're a proposed monetization, mock-only in v26.0, always labelled "Ad", and never change a company's record.
- [ ] Backup demo video (§18.4).

### 4.10 QA and pre-demo (everyone) — PRD §18.3, §18.4

- [ ] Real mode on the Vercel URL: full flow with three wallets in three browser profiles; wrong-network banner; insufficient mIDR; rejected signature; 375px wide.
- [ ] Both proofs generate on the Vercel URL.
- [ ] Every error string matches §11.
- [ ] Each demo wallet has ≥ 0,2 Sepolia ETH and Rp100.000.000 mIDR.
- [ ] One seeded invoice in each status; the demo seller already has a valid badge (backups if a live transaction is slow).
- [ ] Contracts verified; `contracts.ts` points to the final deployment; mocks off; demo mode on.
- [ ] Open the Supabase dashboard before judging (free projects pause after about a week).

---

## 5. The interface contract (don't break it)

The frontend is finished against these. Keep them stable, and the swap from mocks to Sepolia needs no component changes.

- **Types:** `apps/web/src/lib/types.ts`, exactly PRD §16.1. bigint for chain values, unix **seconds** for times, mIDR with **0 decimals**.
- **Hooks:** the signatures in PRD §16.2, exported from `src/lib/hooks/index.ts`. Components never call wagmi or fetch directly.
- **Step ids** for `onStep` (TxStepper renders them): `verify-wallet`, `proving`, `saving-details`, `approving`, `wallet`, `pending`, `success`, `error`. Pass `{ hash }` once a transaction hash exists (it becomes the Etherscan link) and `{ error }` with a §11 message on failure.
- **Errors:** custom errors map to `CONTRACT_ERROR_MESSAGES` in `src/lib/messages.ts`; a user-rejected signature is neutral (`isNeutralError`), not red.
- **Change the contract first:** if a type or hook must change, update PRD §16 and §22–23 first, then tell each other.

---

## 6. What changed on day 1 (read if you missed it)

All recorded in PRD §22–23, and listed as in scope in PRD §6.1 ("Added during the build").

- **Look:** the header is now `brand-900` with the dark logo and runs into each screen's cover band. Tabs and buttons are pills; content sits on white sheets that overlap the band (§9.1, §10.1).
- **Landing (§9.2):** centered hero with a coded product stage, calculator example, tabbed steps, "one invoice, three views", privacy redaction, footer CTA "Capital today. Growth tomorrow."
- **Buyer payment record (§7):** computed from on-chain repayment dates of **financier-funded** invoices (term ≥ 7 days), Rupiah-weighted, tiers Reliable / Mixed / Risky / New. It works on real data as is, because it only reads `useInvoices()`.
- **Companies tab (§9.9):** one row per seller, built from on-chain data; [See] opens the closed-invoice record with timestamps and the reason each invoice ended. Also works on real data as is.
- **Profile ads (§7):** off-chain, mock-only in v26.0, labelled "Ad", order only. `useProfileAds()` returns nothing in real mode.

---

## 7. Codebase gotchas

Plus everything in PRD §12.5.

1. **Next.js 16 with Cache Components.** `usePathname`, `useSearchParams` and dynamic params must be read inside a `<Suspense>` boundary on dynamic routes, or the build fails. Wallet providers go in a client component. If you use wagmi cookie hydration, reading `cookies()` in the root layout also needs Suspense; plain `ssr: true` is simpler, and the app already shows a skeleton while `isConnecting`.
2. **TypeScript target is ES2020** so bigint literals (`10_000_000n`) work. Don't lower it.
3. **`apps/web/package.json` has `"type": "module"`.** Unit tests run with `node --test src/lib/*.test.ts` and import `.ts` files directly, so pure helpers (`format.ts`, `buyer-record.ts`, `company-profiles.ts`) must not import from `@/` aliases.
4. **Mock data lives in localStorage** (`revine.mockData.v3`, shared across tabs) and the mock account in sessionStorage (per tab). Use "Reset demo data" in the account menu if a screen looks odd.
5. **Tailwind classes must be literal strings.** Don't build them at runtime (`${x}:hidden`).
6. **The dev server can stop picking up CSS changes** after long sessions. Restart `npm run dev` and hard-refresh (Cmd+Shift+R).
7. **Light theme only.** Mint is never text on a light background.

---

## 8. Decisions to make in the first 30 minutes

| # | Question | Proposal |
|---|---|---|
| 1 | Who writes the Noir circuits? (§21.1) | Jovan writes circuits + verifiers; frontend dev owns `src/zk/prover.ts`. |
| 2 | Rebalance ownership now that the frontend is done? | Frontend dev takes Vercel, wallet providers + connect button, `fingerprint.ts`, Supabase + `/api/details`. Jovan keeps contracts, deploy, `contracts.ts`, hooks, `/api/attest`, circuits. If agreed, update PRD §17.1. |
| 3 | UI language (§21.2) | English (current decision). |
| 4 | Business-model fee for the pitch (§21.3) | 1% per financed invoice, pitch only, not in contracts (§6.2). Profile ads as a second, optional revenue line. |
| 5 | Who drives which wallet in the live demo? (§21.4) | One laptop, three browser profiles, one presenter; a second person watches Etherscan. |
| 6 | Accent green hex (§21.5) | `#35CB9B` unless the designer says otherwise. |
| 7 | `DESIGN.md` | Regenerate from the current code (it describes the old look). |
| 8 | Repo visibility | Private until the Satoshi license is checked; public for submission if allowed. |

Write each answer in PRD §22.

---

## 9. End-of-day checklist (PRD §5)

- [ ] 1. Three wallets complete create → confirm → list → buy → repay on Sepolia with exact balances.
- [ ] 2. Every action: wallet prompt → pending → success or a friendly error, with an Etherscan link.
- [ ] 3. Loading, empty and error states everywhere (done in mock mode; recheck in real mode).
- [ ] 4. Every screen works at 375px and on desktop (done in mock mode; recheck in real mode).
- [ ] 5. All contracts verified on Sepolia Etherscan.
- [ ] 6. (P1) Credit badge proven in the browser and verified on-chain; the revenue number is never shown.
- [ ] 7. (P2) Invoice proof verified on-chain at creation; the buyer sees "Details match the on-chain fingerprint ✓".
- [ ] 8. No "coming soon" buttons; anything unfinished is hidden.
- [ ] 9. Brand everywhere: logo SVGs, Satoshi, tokens, favicon.
- [ ] 10. README and demo video ready; submission sent.

---

## 10. Kickoff prompts for Claude Code / Cursor

Start each session with: *"Read CLAUDE.md, PRD.md and PRD-day2.md first."* Then:

**Contracts (Jovan)**
> From PRD §13 and §18.1, create the Foundry project in `contracts/` with OpenZeppelin v5: `MockIDR`, `RevineInvoice` and `AlwaysTrueVerifier`, every function, event, error and rule in §13.3–13.4, tests for every case in §18.1, and `script/Deploy.s.sol` in the §13.4 order. Don't touch `apps/web` or `circuits/`.

**contracts.ts + read hooks (Jovan)**
> Install wagmi, viem, RainbowKit and TanStack Query in `apps/web`. Add a client Providers component for Sepolia and wrap the layout. Create `src/lib/contracts.ts` from the deployment (PRD §16.4). Implement the real versions of `useWallet`, `useInvoices`, `useInvoice`, `useBalances` and `useCreditBadge` next to their mock versions, keeping the exact §16.2 signatures. No component changes.

**Connect button (frontend)**
> Replace `ChainWalletButton` in `src/components/wallet-button.tsx` with RainbowKit's `ConnectButton.Custom`, styled exactly like the mock button on the dark header (connected pill with the mint initial, mint "Connect wallet" pill). Keep `MockWalletButton` for `USE_MOCKS=true`.

**Action hooks (Jovan)**
> Implement the real `useRevineActions` from PRD §16.2: `writeContract` + `waitForTransactionReceipt`, approval only when the mIDR allowance is short, `onStep` with the step ids in PRD-day2 §5, the new invoice id from the `InvoiceCreated` event, and custom errors mapped through `CONTRACT_ERROR_MESSAGES`.

**Private details (frontend or Jovan, per §8)**
> From PRD §14.2 and §15, build `src/lib/fingerprint.ts` with unit tests, the Supabase table, `POST`/`GET /api/details` with the §15.2 checks, wallet verification exactly as §15.3, and the real `useInvoiceDetails`. Service-role key server-only.

**Credit badge (P1)**
> From PRD §14.3 and §15.2, build `/api/attest` with `DEMO_REVENUE`, the credit circuit in `circuits/credit` with a `nargo test` that uses a signature from the real attester code, and `src/zk/prover.ts` (client-only, EVM-compatible proofs). Wire `getAttestation` and `publishCreditBadge`. Versions pinned as in PRD §22.

**QA**
> With `NEXT_PUBLIC_USE_MOCKS=false`, walk every screen in PRD §9 against Sepolia at 375px and 1280px. List any state that's missing, any copy that doesn't match §10–11, and any action whose stepper skips a step. Report before fixing.
