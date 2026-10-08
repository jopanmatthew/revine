# Product

<!-- impeccable:product-schema 1 -->

Distilled from PRD.md for design work. PRD.md is the source of truth; when they disagree, PRD.md wins and this file gets updated.

## Platform

web

## Users

- **Seller (primary):** micro and small Indonesian suppliers (UMKM) selling to businesses on 30–90-day terms: rice and food suppliers to restaurants, caterers, small garment makers, printing shops. Persona: Bu Sari ("Beras Bu Sari", Jakarta). Runs her business from a phone and WhatsApp, has never used crypto, was turned down by her bank. Her job: turn an invoice the customer will pay later into cash today.
- **Financier (secondary):** small financing companies, P2P lenders, investors with idle capital. Demo: Modal Maju. Their job: pick short-term verified invoices, judge risk, earn a return.
- **Buyer (participant):** the restaurant, shop or company that owes the invoice. Demo: RM Selera Kita. Their job: confirm an invoice is real, then pay the full amount on time, with minimal effort.
- **Judges (demo audience):** ETHJKT hackathon judges watching a 3-minute, three-window demo.

## Product Purpose

revine. is invoice financing for Indonesian SMEs. The seller creates an invoice, the buyer confirms it, the seller sells it to a financier at a small discount and gets paid now; on the due date the buyer pays the full amount through a smart contract that sends it to whoever holds the invoice. Success for v26.0: create → confirm → list → buy → repay works end to end on Sepolia with exact balances, and an SME owner with no crypto background understands every screen.

## Positioning

Each confirmed invoice is an on-chain token whose holder has the right to collect, so ownership is clear, the same invoice can't be sold twice on revine., and repayment routes itself. Zero-knowledge proofs keep line items, prices and the seller's revenue private while proving they're valid: financiers see a credit tier ("Revenue above Rp100 jt"), never the number.

## Operating Context

- Mobile-first: sellers work from a phone; every screen must work at 375px and on desktop.
- The demo runs as three browser windows side by side (seller, buyer, financier) that react to each other through live refetching.
- Testnet only: mock Rupiah (mIDR, 0 decimals, 1 mIDR = Rp1) and a demo bank; both are labeled. Users pay Sepolia gas themselves.
- Every on-chain action runs through one shared step-by-step progress view with an Etherscan link.

## Capabilities and Constraints

- Scope is fixed by PRD §6: build only §6.1, never §6.2 (no dark mode, no charts, no notifications, no Bahasa Indonesia, no secondary market, no fees).
- Routes are only those in PRD §9.0.
- Money in Rupiah with Indonesian formatting (Rp10.000.000, 3,09%); dates like "7 Nov 2026"; due dates are 23:59:59 WIB.
- Plain words first, chain details one click away: "Get financed", not "mint NFT"; token IDs and fingerprints live in a collapsed "On-chain details" panel. Copy rules in PRD §10.2, exact error strings in §11.
- Repayment is buyer-only, full amount, always to the current holder. Approvals are for the exact amount.
- Anything that doesn't work is hidden, never shown disabled or "coming soon".

## Brand Commitments

- Name is always lowercase with the dot: **revine.** Tagline: "Turn invoices into opportunities."
- Brand from the designer's brand board (PRD §10.1), binding: brand-900 #0B1F1A, brand-700 #16634B, mint #35CB9B (to be confirmed), bg #F8FAF6, ink #1F2A26, ink-muted #6B6F6C; mint is never text on a light background.
- Satoshi (400 body, 500 labels and buttons, 700 headings and big amounts), self-hosted.
- Calm, premium fintech: generous white space, white cards on bg, rounded corners about 12–16px, light theme only. Landing hero and footer on brand-900.
- Logo SVGs come from the designer; never redraw the logo or mark. The mark's slanted parallelogram shapes may be reused only as large decorative shapes in the landing hero. No other illustrations.
- Status is always text plus color, with the badge styles in PRD §10.1.
- Voice: short sentences, "you", no crypto jargon on main screens; friendly errors that say what happened and what to do next. Wallet cancellations are neutral, not red.

## Evidence on Hand

- Demo cast and demo invoice (PRD §4, §9.5): Beras Bu Sari, RM Selera Kita, Modal Maju; Rp10.000.000 invoice → Rp9.700.000 at 3%.
- Mock data in apps/web/src/lib/mock.ts (one invoice per status, overdue and expired cases).
- No real customers, testimonials, partners or usage numbers exist; never invent them.

## Product Principles

1. Rupiah everywhere and the money story first: what you receive, what you pay, what you earn.
2. One clear job per screen and one obvious action per row.
3. Never a frozen button: every action shows its steps, and errors say what to do next.
4. Privacy is visible: say what's public and what stays private.
5. Demo clarity beats density: large amounts, roomy cards, readable on a phone and in a live demo.

## Accessibility & Inclusion

- Touch targets at least 44px tall on mobile; primary action is a sticky bottom button on mobile.
- Status never by color alone. Text contrast: brand-700 for green text (mint fails on light).
