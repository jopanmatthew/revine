---
version: 1
slug: "apps-web-src-app-financier-page-tsx"
primary_target: "apps/web/src/app/financier/page.tsx"
related_targets: ["apps/web/src/app/buyer/page.tsx","apps/web/src/app/seller/page.tsx"]
---

# App screens (Operate)

Scope: every app screen: `/app` (§9.3), `/seller` + Get financed sheet (§9.4, §9.6), `/seller/new` (§9.5), `/seller/credit` (§9.7), `/buyer` (§9.8), `/financier` (§9.9), `/invoice/[id]` (§9.10). Mock data via the §16.2 hooks only.

Audience and job: Bu Sari gets paid today; RM Selera Kita confirms and pays; Modal Maju picks invoices by return and tracks what it holds. Three-window live judge demo; the user found the previous build "too overwhelming": calm and clear beats complete-at-a-glance.

Constraints: every element PRD §9 lists stays (user-confirmed); some may sit one tap away. Header stays light with the light logo (§9.1). Brand pinned by §10.1 (tokens, Satoshi, mint never as text on light). Copy §10.2, errors §11.

## Direction contract

THESIS: revine. reads like a bank passbook: one dark cover band carrying the one number that matters and the one thing to do, then a calm printed ledger, one line per invoice. Refuses the stat tiles + tabs + card grid dashboard the category ships.

OWN-WORLD: brand-900 cover band under the light header; #F8FAF6 page; one white ledger sheet ruled with one-pixel hairlines; Satoshi on a fixed magnitude ramp (one hero figure per screen); mint only as the printed underline and fills; status as the PRD badge, said once; no card inside a card.

STORY: see where you stand (cover), do the one thing (cover action), scan the ledger, tap a line to focus that invoice.

FIRST VIEWPORT: light header; dark cover band with a small greeting, the hero amount (seller: ready to finance; buyer: you owe; financier: owed to you, or profit on Portfolio), up to three secondary figures in one row, the primary action at the band's right (sticky bottom bar on phones); then underline tabs and the ledger sheet.

FORM: The Passbook, the assigned direction, seed 93a43b58 (kind: assigned, chosen by the user on the decision page). Signature move: new money prints in: a fresh ledger line's amount reveals left to right with a mint underline drawn beneath it, and a cover figure re-prints when its value changes. Raises: nothing is labelled twice (Catalog Sleeve); one fixed size ramp (Star Atlas); focus instead of cards, tapping a line opens that invoice (Datamatics); one-pixel hairlines, no boxes in boxes (Centre-Rail).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
