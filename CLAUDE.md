# CLAUDE.md — revine.

Read PRD.md before starting any task. It is the source of truth.

- Release v26.0 is an SLC release. Build only what PRD §6.1 lists, in priority order. Never build anything in §6.2 "Out of scope".
- Network: Sepolia only. mIDR has 0 decimals (1 mIDR = Rp1). Contract times are unix seconds.
- Use the types in src/lib/types.ts and the hooks in src/lib/hooks/. Components never call wagmi or fetch directly.
- With NEXT_PUBLIC_USE_MOCKS=true, use src/lib/mock.ts.
- Brand: use the color tokens, Satoshi and logo SVGs from PRD §10.1. Never use the mint accent as text on light backgrounds. Never redraw the logo.
- UI copy follows PRD §10.2. Error messages use the exact strings in §11.
- Routes are only those in §9.0.
- If code and PRD disagree, stop and ask. If a decision changes, update PRD.md (§22, §23) first.
